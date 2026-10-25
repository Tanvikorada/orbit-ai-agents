"use client";

import {
  ArrowRight,
  CheckCircle,
  Copy,
  DownloadSimple,
  FileText,
  LockSimple,
  Play,
  Plus,
  Stop,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FeedRow, TaskList } from "@/components/mission";
import { Logo } from "@/components/ui";
import { EXAMPLE_GOALS } from "@/lib/examples";
import type { Deliverable, Task } from "@/lib/events";
import { CODE_KEY, readCode, useRun, type RunState } from "@/lib/useRun";

export default function Workspace() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, start, stop, reset } = useRun();
  const [open, setOpen] = useState<Deliverable | null>(null);
  const autostarted = useRef(false);

  useEffect(() => {
    const goal = params.get("goal");
    if (goal && !autostarted.current) {
      autostarted.current = true;
      start(goal, params.get("demo") === "1");
      router.replace("/workspace");
    }
  }, [params, router, start]);

  const running = state.status === "running";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Orbit home" className="shrink-0">
            <Logo />
          </Link>
          {state.goal && (
            <p className="hidden min-w-0 flex-1 truncate text-sm text-muted md:block" title={state.goal}>
              {state.goal}
            </p>
          )}
          <div className="ml-auto flex items-center gap-3">
            <StatusPill state={state} />
            {running ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm transition hover:bg-panel-2 active:scale-[0.98]"
              >
                <Stop size={14} weight="fill" /> Stop
              </button>
            ) : (
              state.status !== "idle" && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Plus size={14} weight="bold" /> New run
                </button>
              )
            )}
          </div>
        </div>
        {running && <div className="progress-bar h-px" />}
      </header>

      {state.status === "idle" ? (
        <Composer onStart={start} />
      ) : (
        <main className="grid flex-1 gap-px bg-line lg:grid-cols-[300px_minmax(0,1fr)_340px]">
          <MissionBoard tasks={state.tasks} running={running} />
          <LiveFeed state={state} onOpen={(id) => setOpen(state.deliverables.find((d) => d.id === id) ?? null)} />
          <Deliverables items={state.deliverables} running={running} onOpen={setOpen} />
        </main>
      )}

      {open && <Viewer deliverable={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function StatusPill({ state }: { state: RunState }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state.status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.status]);

  if (state.status === "idle") return null;
  const elapsed = Math.max(0, Math.round(((state.status === "running" ? now : state.endedAt) - state.startedAt) / 1000));
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const label = { running: "Working", done: "Complete", error: "Error", stopped: "Stopped" }[state.status];
  const tokens = state.usage.input + state.usage.output;

  return (
    <div className="flex items-center gap-3 font-mono text-xs text-muted">
      {state.mode === "demo" && (
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider">Demo</span>
      )}
      {tokens > 0 && <span className="hidden tabular-nums sm:inline">{(tokens / 1000).toFixed(1)}k tokens</span>}
      <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums text-text">
        {state.status === "running" && <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />}
        {state.status === "done" && <CheckCircle size={14} weight="fill" className="text-[var(--analyst)]" />}
        {state.status === "error" && <WarningCircle size={14} weight="fill" className="text-[var(--writer)]" />}
        {label} {clock}
      </span>
    </div>
  );
}

function Composer({ onStart }: { onStart: (goal: string, demo?: boolean) => void }) {
  const [goal, setGoal] = useState("");
  const [locked, setLocked] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    setCode(readCode());
    fetch("/api/run")
      .then((r) => r.json())
      .then((d: { locked?: boolean }) => setLocked(Boolean(d.locked)))
      .catch(() => {});
  }, []);

  const saveCode = (value: string) => {
    setCode(value);
    try {
      localStorage.setItem(CODE_KEY, value);
    } catch {
      // storage unavailable; the code is kept for this page only
    }
  };

  const submit = () => goal.trim() && onStart(goal.trim());

  return (
    <main className="relative flex flex-1 items-start justify-center overflow-hidden px-4 pb-16 pt-16 sm:pt-24">
      <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2" />
      <div className="relative w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What should the team work on?</h1>
        <p className="mt-3 max-w-[60ch] text-muted">
          Describe an outcome. Orbit plans it, researches it live and hands back finished work.
        </p>

        <form
          className="mt-8 rounded-2xl border border-line bg-panel/80 p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] transition-colors focus-within:border-accent/60"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="goal" className="sr-only">
            Goal
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={4}
            maxLength={2000}
            placeholder="Find 10 boutique fitness studios in Hyderabad that would pay for online booking, and write outreach for each"
            className="w-full resize-none bg-transparent p-3 text-[15px] leading-relaxed outline-none placeholder:text-muted"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-2 pt-2">
            <span className="hidden font-mono text-xs text-muted sm:inline">Ctrl + Enter to launch</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={!goal.trim()}
                onClick={() => onStart(goal.trim(), true)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-text disabled:opacity-40"
              >
                <Play size={14} /> Demo
              </button>
              <button
                type="submit"
                disabled={!goal.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Launch a run <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </form>

        {locked && (
          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="code" className="flex items-center gap-1.5 text-sm text-muted">
              <LockSimple size={14} /> Access code for live runs
            </label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => saveCode(e.target.value)}
              autoComplete="off"
              className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm outline-none transition-colors focus:border-accent sm:w-72"
            />
            <p className="text-xs text-muted">Without a code, runs play as a demo.</p>
          </div>
        )}

        <div className="mt-10">
          <p className="mb-3 text-sm text-muted">Or start from an example</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXAMPLE_GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className="rounded-xl border border-line bg-panel/60 px-4 py-3 text-left text-sm leading-snug text-muted transition hover:border-accent/50 hover:text-text"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function MissionBoard({ tasks, running }: { tasks: Task[]; running: boolean }) {
  const done = tasks.filter((t) => t.status === "done").length;
  return (
    <section className="bg-bg p-4 sm:p-5">
      <PanelTitle title="Mission board" meta={tasks.length ? `${done}/${tasks.length}` : undefined} />
      {tasks.length > 0 && (
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${(done / tasks.length) * 100}%` }}
          />
        </div>
      )}
      {tasks.length === 0 ? (
        running ? (
          <SkeletonTasks />
        ) : (
          <Empty text="No tasks yet." />
        )
      ) : (
        <TaskList tasks={tasks} />
      )}
    </section>
  );
}

function SkeletonTasks() {
  return (
    <div className="flex flex-col gap-2" aria-label="Planning the mission">
      {[0, 1, 2].map((i) => (
        <div key={i} className="shimmer h-[74px] rounded-xl border border-line" />
      ))}
      <p className="mt-1 text-xs text-muted">Planning the mission</p>
    </div>
  );
}

function LiveFeed({ state, onOpen }: { state: RunState; onOpen: (id: string) => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    if (stick.current && state.status === "running") endRef.current?.scrollIntoView({ block: "nearest" });
  }, [state.feed, state.status]);

  return (
    <section className="flex min-h-[50vh] flex-col bg-bg lg:max-h-[calc(100dvh-57px)]">
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <PanelTitle title="Live feed" />
      </div>
      <div
        ref={boxRef}
        onScroll={() => {
          const el = boxRef.current;
          if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="scroll-thin flex-1 overflow-y-auto px-4 pb-6 sm:px-6"
      >
        <ol className="flex flex-col gap-3">
          {state.feed.map((item) => (
            <FeedRow key={item.id} item={item} onOpen={onOpen} />
          ))}
        </ol>
        {state.status === "running" && (
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" /> Agents working
          </p>
        )}
        {state.summary && (
          <div className="rise mt-6 rounded-2xl border border-[var(--analyst)]/30 bg-[var(--analyst)]/[0.06] p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--analyst)]">
              <CheckCircle size={16} weight="fill" /> Mission complete
            </p>
            <p className="mt-2 text-[15px] leading-relaxed">{state.summary}</p>
          </div>
        )}
        {state.status === "error" && (
          <div className="mt-6 rounded-2xl border border-[var(--writer)]/40 bg-[var(--writer)]/[0.06] p-5 text-sm">
            <p className="flex items-center gap-2 font-medium text-[var(--writer)]">
              <WarningCircle size={16} weight="fill" /> Run failed
            </p>
            <p className="mt-1 text-muted">{state.error}</p>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}

function Deliverables({
  items,
  running,
  onOpen,
}: {
  items: Deliverable[];
  running: boolean;
  onOpen: (d: Deliverable) => void;
}) {
  return (
    <section className="bg-bg p-4 sm:p-5">
      <PanelTitle title="Deliverables" meta={items.length ? String(items.length) : undefined} />
      {items.length === 0 ? (
        <Empty text={running ? "Finished work will appear here as each task completes." : "Nothing delivered yet."} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((d) => (
            <li key={d.id} className="rise">
              <button
                onClick={() => onOpen(d)}
                className="group w-full rounded-xl border border-line bg-panel p-3.5 text-left transition hover:border-accent/50 hover:bg-panel-2"
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{d.kind}</span>
                  <ArrowRight
                    size={14}
                    className="ml-auto text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{preview(d.content)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Viewer({ deliverable, onClose }: { deliverable: Deliverable; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    const blob = new Blob([deliverable.content], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deliverable.title.replace(/[^\w-]+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal>
      <div
        className="slide-in flex h-full w-full max-w-3xl flex-col border-l border-line bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <FileText size={16} className="text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{deliverable.kind}</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(deliverable.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm transition hover:bg-panel-2"
            >
              {copied ? <CheckCircle size={14} weight="fill" className="text-[var(--analyst)]" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm transition hover:bg-panel-2"
            >
              <DownloadSimple size={14} /> Download
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-text"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <article className="md scroll-thin flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
          >
            {deliverable.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

function PanelTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xs font-medium text-muted">{title}</h2>
      {meta && <span className="font-mono text-xs tabular-nums text-muted">{meta}</span>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line p-4 text-sm leading-relaxed text-muted">{text}</p>;
}

const preview = (md: string) =>
  md
    .replace(/[#>*_`|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
