import { createHash, timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "@/lib/agent";
import { runDemo } from "@/lib/demo";
import type { RunEvent } from "@/lib/events";
import { runGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

// Gemini (free tier) wins when its key is set, then Claude; with neither, demo mode.
const provider = () =>
  process.env.GEMINI_API_KEY
    ? runGemini
    : process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
      ? runAgent
      : null;
const hasCredentials = () => provider() !== null;

// When ORBIT_ACCESS_CODE is set, live runs need the code; everyone else gets the demo.
const accessCode = () => process.env.ORBIT_ACCESS_CODE?.trim() || "";
const digest = (s: string) => createHash("sha256").update(s).digest();
const codeMatches = (given: unknown) =>
  typeof given === "string" && timingSafeEqual(digest(given.trim()), digest(accessCode()));

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { goal?: unknown; demo?: unknown; code?: unknown };
  const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 2000) : "";
  if (!goal) return Response.json({ error: "Describe a goal to start a run." }, { status: 400 });

  const run = provider();
  const hasCode = typeof body.code === "string" && body.code.trim() !== "";
  if (run && accessCode() && hasCode && !codeMatches(body.code)) {
    return Response.json({ error: "That access code is not right." }, { status: 403 });
  }
  const locked = Boolean(run && accessCode() && !hasCode && body.demo !== true);
  const demo = body.demo === true || !run || locked;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (event: RunEvent) => {
        if (!closed) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        if (demo || !run) {
          if (locked) {
            emit({
              type: "say",
              text: "Live runs on this site need an access code, so here is a demo run instead. Add the code under the goal box to run it live.\n\n",
            });
          }
          await runDemo(goal, emit, req.signal);
        } else {
          emit({ type: "start", mode: "live", goal });
          await run(goal, emit, req.signal);
        }
      } catch (err) {
        if (!req.signal.aborted) {
          const message =
            err instanceof Anthropic.AuthenticationError
              ? "The API key was rejected. Check ANTHROPIC_API_KEY."
              : err instanceof Anthropic.RateLimitError
                ? "Rate limited by the API. Wait a moment and try again."
                : err instanceof Anthropic.APIError
                  ? `API error ${err.status}: ${err.message}`
                  : err instanceof Error
                    ? err.message
                    : "Unexpected error";
          emit({ type: "error", message });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed by a client disconnect
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Run-Mode": demo ? "demo" : "live",
    },
  });
}

export async function GET() {
  return Response.json({ live: hasCredentials(), locked: hasCredentials() && accessCode() !== "" });
}
