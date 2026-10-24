import {
  ApiError,
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type GenerateContentResponseUsageMetadata,
  type Part,
} from "@google/genai";
import type { Emit } from "./events";
import { createMission, MISSION_TOOLS, SYSTEM } from "./mission";
import { tavilySearch } from "./search";

// Tried in order. Free-tier quotas are counted per model, so when one is out of quota (429),
// overloaded (503) or stalls, the run moves to the next one and stays there.
const MODELS = [
  ...new Set([process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"]),
];
// Busy free-tier models sometimes queue a request instead of rejecting it.
const FIRST_CHUNK_TIMEOUT_MS = 45_000;

// Every request counts against a small daily quota, so ask for batched tool calls.
const BATCHING = `

Efficiency: you may call several tools in one turn, and you should. For example, mark a task done, publish its deliverable and start the next task in a single response, or run two searches at once.`;

class Stalled extends Error {}
const MAX_TURNS = 30;
const MAX_SEARCHES = 8;
const MAX_NUDGES = 2;

const WEB_SEARCH = {
  name: "web_search",
  description: "Search the live web. Returns the top results with title, URL and a relevant excerpt.",
  parameters: {
    type: "object",
    properties: { query: { type: "string", description: "Search query" } },
    required: ["query"],
  },
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });

export async function runGemini(goal: string, emit: Emit, signal: AbortSignal) {
  // SDK retries are turned off so rate-limit waits are handled (and shown) below.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { retryOptions: { attempts: 1 } } });
  const mission = createMission(emit);
  const canSearch = Boolean(process.env.TAVILY_API_KEY);
  const tools = canSearch ? [...MISSION_TOOLS, WEB_SEARCH] : MISSION_TOOLS;
  const system =
    (canSearch
      ? SYSTEM
      : SYSTEM.replace(/^3\. Use web_search.*$/m, "3. You have no web access: work from your own knowledge and clearly mark facts that may be out of date or unverified.")) +
    BATCHING;

  const contents: Content[] = [{ role: "user", parts: [{ text: `Goal: ${goal}` }] }];
  const usage = { input: 0, output: 0 };
  let searches = 0;
  let nudges = 0;
  let modelIndex = 0;

  async function webSearch(query: string) {
    if (searches >= MAX_SEARCHES) return { error: "Search limit for this run reached. Continue with what you have." };
    searches += 1;
    emit({ type: "search", query });
    const results = await tavilySearch(query, signal);
    emit({ type: "sources", sources: results.map(({ title, url }) => ({ title, url })) });
    return { output: results.map((r) => ({ ...r, content: r.content.slice(0, 1200) })) };
  }

  for (let turn = 0; turn < MAX_TURNS && !mission.state.finished; turn++) {
    const modelParts: Part[] = [];
    const calls: FunctionCall[] = [];
    let lastMeta: GenerateContentResponseUsageMetadata | undefined;

    // Free-tier models are often busy (503) or rate limited (429): switch model or wait, then retry.
    for (let attempt = 0; ; attempt++) {
      const stall = new AbortController();
      const timer = setTimeout(() => stall.abort(new Stalled()), FIRST_CHUNK_TIMEOUT_MS);
      try {
        const stream = await ai.models.generateContentStream({
          model: MODELS[modelIndex],
          contents,
          config: {
            systemInstruction: system,
            tools: [
              {
                functionDeclarations: tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parametersJsonSchema: t.parameters,
                })),
              },
            ],
            thinkingConfig: { includeThoughts: true },
            abortSignal: AbortSignal.any([signal, stall.signal]),
          },
        });
        for await (const chunk of stream) {
          clearTimeout(timer);
          for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            modelParts.push(part);
            if (part.text) emit({ type: part.thought ? "thought" : "say", text: part.text });
            if (part.functionCall) calls.push(part.functionCall);
          }
          const meta = chunk.usageMetadata;
          if (meta?.promptTokenCount) {
            emit({
              type: "usage",
              input: usage.input + meta.promptTokenCount,
              output: usage.output + (meta.candidatesTokenCount ?? 0) + (meta.thoughtsTokenCount ?? 0),
            });
            lastMeta = meta;
          }
        }
        clearTimeout(timer);
        break;
      } catch (err) {
        clearTimeout(timer);
        const stalled = stall.signal.aborted && !signal.aborted;
        const status = stalled ? 503 : err instanceof ApiError ? err.status : 0;
        if ((status !== 429 && status !== 503) || attempt >= 5 || signal.aborted) throw friendly(err);
        modelParts.length = 0;
        calls.length = 0;
        lastMeta = undefined;
        if (modelIndex < MODELS.length - 1) {
          modelIndex += 1;
          const why = status === 429 ? "has used up its free quota" : "is busy right now";
          emit({ type: "thought", text: `${MODELS[modelIndex - 1]} ${why}, switching to ${MODELS[modelIndex]}. ` });
          continue;
        }
        if (status === 429 && err instanceof Error && /PerDay/.test(err.message)) {
          throw new Error("Today's free Gemini quota is used up for every model Orbit tries. It resets daily; try again tomorrow, or use demo mode.");
        }
        const wait = 15 * (attempt + 1);
        emit({ type: "thought", text: `Gemini is ${status === 429 ? "rate limiting the free tier" : "busy"}, waiting ${wait}s before continuing. ` });
        await sleep(wait * 1000, signal);
      }
    }

    if (lastMeta) {
      usage.input += lastMeta.promptTokenCount ?? 0;
      usage.output += (lastMeta.candidatesTokenCount ?? 0) + (lastMeta.thoughtsTokenCount ?? 0);
    }

    if (modelParts.length) contents.push({ role: "model", parts: modelParts });

    if (calls.length === 0) {
      // Smaller models sometimes stop to narrate; push them back on track.
      if (nudges++ >= MAX_NUDGES) break;
      contents.push({
        role: "user",
        parts: [{ text: "Continue: work through the remaining tasks using your tools, then call finish." }],
      });
      continue;
    }

    const responses: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      let response: Record<string, unknown>;
      if (name === "web_search" && canSearch) {
        try {
          response = await webSearch(String((call.args as { query?: unknown })?.query ?? ""));
        } catch (err) {
          response = { error: err instanceof Error ? err.message : "Search failed" };
        }
      } else {
        const outcome = mission.execute(name, call.args ?? {});
        response = outcome.is_error ? { error: outcome.content } : { output: outcome.content };
      }
      responses.push({ functionResponse: { id: call.id, name, response } });
    }
    contents.push({ role: "user", parts: responses });
  }

  if (!mission.state.finished) emit({ type: "done", summary: "Run ended. See the deliverables for the work produced." });
}

function friendly(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 429) return new Error("Gemini free-tier limit reached. Wait a minute (or until tomorrow for the daily quota) and try again.");
    if (err.status === 400 || err.status === 403) return new Error(`Gemini rejected the request (${err.status}). Check GEMINI_API_KEY and GEMINI_MODEL.`);
    return new Error(`Gemini API error ${err.status}: ${err.message}`);
  }
  return err;
}
