import Anthropic from "@anthropic-ai/sdk";
import type { Emit } from "./events";
import { createMission, MISSION_TOOLS, SYSTEM } from "./mission";

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 24;

const tools: Anthropic.Beta.BetaToolUnion[] = [
  ...MISSION_TOOLS.map(
    (t): Anthropic.Beta.BetaTool => ({
      name: t.name,
      description: t.description,
      eager_input_streaming: true,
      input_schema: t.parameters as Anthropic.Beta.BetaTool.InputSchema,
    }),
  ),
  { type: "web_search_20260209", name: "web_search", max_uses: 8 },
];

export async function runAgent(goal: string, emit: Emit, signal: AbortSignal) {
  const client = new Anthropic();
  const mission = createMission(emit);
  let jsonRetries = 0;
  const usage = { input: 0, output: 0 };

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Goal: ${goal}` },
  ];

  for (let turn = 0; turn < MAX_TURNS && !mission.state.finished; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 64000,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        thinking: { type: "adaptive", display: "summarized" },
        output_config: { effort: "high" },
        tools,
        messages,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") emit({ type: "say", text: event.delta.text });
        else if (event.delta.type === "thinking_delta") emit({ type: "thought", text: event.delta.thinking });
      } else if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          emit({
            type: "sources",
            sources: block.content
              .filter((r) => r.type === "web_search_result")
              .map((r) => ({ title: r.title, url: r.url })),
          });
        }
      } else if (event.type === "content_block_stop") {
        // Server tool inputs are complete once their block stops.
        const block = stream.currentMessage?.content[event.index];
        if (block?.type === "server_tool_use" && block.name === "web_search") {
          const query = (block.input as { query?: string })?.query;
          if (query) emit({ type: "search", query });
        }
      }
    }

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Only an unparseable streamed tool input is retried; API errors propagate.
      if (err instanceof Anthropic.APIError || signal.aborted || jsonRetries++ >= 2) throw err;
      continue;
    }

    usage.input += message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0);
    usage.output += message.usage.output_tokens;
    emit({ type: "usage", ...usage });

    if (message.stop_reason === "refusal") {
      throw new Error("The model declined this request. Try rephrasing the goal.");
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }

    const toolUses = message.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );
    if (toolUses.length === 0) break;
    if (message.stop_reason === "max_tokens") {
      throw new Error("A response was cut off at the token limit.");
    }

    messages.push({ role: "assistant", content: message.content });
    messages.push({
      role: "user",
      content: toolUses.map((block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        ...mission.execute(block.name, block.input),
      })),
    });
  }

  if (!mission.state.finished) emit({ type: "done", summary: "Run ended. See the deliverables for the work produced." });
}
