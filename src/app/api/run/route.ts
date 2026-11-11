import { createHash, timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { runAgent } from "@/lib/agent";
import { runDemo } from "@/lib/demo";
import type { Deliverable, Emit, RunEvent, Task } from "@/lib/events";
import { runGemini } from "@/lib/gemini";
import { DAILY_RUN_LIMIT } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

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

// When ORBIT_ACCESS_CODE is set, live runs need the code or a signed-in account
// (limited to DAILY_RUN_LIMIT a day); everyone else gets the demo.
const accessCode = () => process.env.ORBIT_ACCESS_CODE?.trim() || "";
const digest = (s: string) => createHash("sha256").update(s).digest();
const codeMatches = (given: unknown) =>
  typeof given === "string" && timingSafeEqual(digest(given.trim()), digest(accessCode()));

const startOfUtcDay = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

async function runsToday(supabase: SupabaseClient) {
  const { count } = await supabase
    .from("runs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfUtcDay());
  return count ?? 0;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { goal?: unknown; demo?: unknown; code?: unknown };
  const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 2000) : "";
  if (!goal) return Response.json({ error: "Describe a goal to start a run." }, { status: 400 });

  const run = provider();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasCode = typeof body.code === "string" && body.code.trim() !== "";
  const codeOk = hasCode && accessCode() !== "" && codeMatches(body.code);
  if (run && accessCode() && hasCode && !codeOk) {
    return Response.json({ error: "That access code is not right." }, { status: 403 });
  }

  let live = Boolean(run) && body.demo !== true;
  let note = "";
  if (live && !codeOk && accessCode()) {
    if (user) {
      if ((await runsToday(supabase)) >= DAILY_RUN_LIMIT) {
        return Response.json(
          { error: `You've used your ${DAILY_RUN_LIMIT} live runs for today. They reset at midnight UTC.` },
          { status: 429 },
        );
      }
    } else {
      live = false;
      note = `Sign in to run this live (${DAILY_RUN_LIMIT} free runs a day). Here is a demo run instead.\n\n`;
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: RunEvent) => {
        if (!closed) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      const recorder = live && user ? await startRecording(supabase, user, goal, send) : null;
      const emit: Emit = recorder ? recorder.emit : send;

      try {
        if (!live || !run) {
          if (note) emit({ type: "say", text: note });
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
        await recorder?.finish(req.signal.aborted);
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
      "X-Run-Mode": live ? "live" : "demo",
    },
  });
}

// Saves a signed-in user's live run: a row at the start, then the results at the end.
async function startRecording(supabase: SupabaseClient, user: User, goal: string, send: Emit) {
  const { data, error } = await supabase.from("runs").insert({ goal }).select("id").single();
  if (error || !data) return null;
  const runId = data.id as string;
  send({ type: "saved", runId });

  const tasks = new Map<string, Task>();
  const deliverables: Deliverable[] = [];
  const result = { summary: null as string | null, error: null as string | null, input: 0, output: 0 };

  const emit: Emit = (event) => {
    if (event.type === "tasks") event.tasks.forEach((t) => tasks.set(t.id, { ...t }));
    if (event.type === "task_update") {
      const t = tasks.get(event.id);
      if (t) Object.assign(t, { status: event.status, note: event.note });
    }
    if (event.type === "deliverable") deliverables.push(event.deliverable);
    if (event.type === "done") result.summary = event.summary;
    if (event.type === "error") result.error = event.message;
    if (event.type === "usage") Object.assign(result, { input: event.input, output: event.output });
    send(event);
  };

  const finish = async (aborted: boolean) => {
    await supabase
      .from("runs")
      .update({
        status: result.error ? "error" : aborted && !result.summary ? "stopped" : "done",
        summary: result.summary,
        error: result.error,
        tasks: [...tasks.values()],
        deliverables,
        input_tokens: result.input,
        output_tokens: result.output,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", user.id);
  };

  return { emit, finish };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const remaining = user ? Math.max(0, DAILY_RUN_LIMIT - (await runsToday(supabase))) : null;
  return Response.json({
    live: hasCredentials(),
    locked: hasCredentials() && accessCode() !== "",
    signedIn: Boolean(user),
    limit: DAILY_RUN_LIMIT,
    remaining,
  });
}
