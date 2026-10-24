"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentBadge, Logo } from "@/components/ui";
import { EXAMPLE_GOALS } from "@/lib/examples";
import type { Deliverable, Task } from "@/lib/events";
import { CODE_KEY, readCode, useRun, type FeedItem, type RunState } from "@/lib/useRun";

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
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" aria-label="Orbit home">
          <Logo />
        </Link>
        {state.goal && (
          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted md:block" title={state.goal}>
            <span className="text-line">/</span> {state.goal}
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <StatusPill state={state} />
          {running ? (
            <button onClick={stop} className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel-2">
              Stop
            </button>
          ) : (
            state.status !== "idle" && (
              <button
                onClick={reset}
                className="whitespace-nowrap rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black hover:brightness-110"
              >
                New run
              </button>
            )
          )}
        </div>
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
  const dot = { running: "var(--accent)", done: "var(--analyst)", error: "var(--writer)", stopped: "var(--muted)" }[state.status];
  const tokens = state.usage.input + state.usage.output;

  return (
    <div className="flex items-center gap-3 font-mono text-xs text-muted">
      {state.mode === "demo" && (
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Demo</span>
      )}
      {tokens > 0 && <span className="hidden sm:inline">{(tokens / 1000).toFixed(1)}k tokens</span>}
      <span className="flex items-center gap-1.5 whitespace-nowrap text-text">
        <span className={`h-2 w-2 rounded-full ${state.status === "running" ? "pulse-dot" : ""}`} style={{ background: dot }} />
        {label} · {clock}
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
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What should the team work on?</h1>
      <p className="mt-3 text-muted">Describe an outcome. Orbit plans it, researches it live and hands back finished work.</p>
      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (goal.trim()) onStart(goal.trim());
        }}
      >
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && goal.trim()) onStart(goal.trim());
          }}
          rows={4}
          maxLength={2000}
          placeholder="e.g. Find 10 boutique fitness studios in Hyderabad that would pay for an online booking system, and write outreach for each"
          className="w-full resize-none rounded-lg border border-line bg-panel p-4 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent"
        />
        {locked && (
          <label className="mt-3 flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-3">
            <span className="text-muted">Access code for live runs</span>
            <input
              type="password"
              value={code}
              onChange={(e) => saveCode(e.target.value)}
              placeholder="Leave empty to watch a demo"
              autoComplete="off"
              className="rounded-md border border-line bg-panel px-3 py-1.5 outline-none placeholder:text-muted/60 focus:border-accent sm:w-64"
            />
          </label>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!goal.trim()}
            className="rounded-md bg-accent px-4 py-2 font-medium text-black hover:brightness-110 disabled:opacity-40"
          >
            Launch run
          </button>
          <button
            type="button"
            disabled={!goal.trim()}
            onClick={() => onStart(goal.trim(), true)}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-panel-2 disabled:opacity-40"
          >
            Watch a demo run
          </button>
          <span className="font-mono text-xs text-muted">Ctrl + Enter</span>
        </div>
      </form>
      <div className="mt-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">Try one</p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className="rounded-md border border-line bg-panel px-3 py-2 text-left text-sm text-muted hover:border-accent/60 hover:text-text"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

const STATUS_ORDER: Task["status"][] = ["active", "todo", "blocked", "done"];

function MissionBoard({ tasks, running }: { tasks: Task[]; running: boolean }) {
  const done = tasks.filter((t) => t.status === "done").length;
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [tasks],
  );
  return (
    <section className="bg-bg p-4 sm:p-5">
      <PanelTitle title="Mission board" meta={tasks.length ? `${done}/${tasks.length}` : undefined} />
      {tasks.length > 0 && (
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      )}
      {tasks.length === 0 ? (
        <Empty text={running ? "Planning the mission..." : "No tasks yet."} pulse={running} />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((t) => (
            <li
              key={t.id}
              className={`rise rounded-lg border p-3 ${
                t.status === "active" ? "border-accent/60 bg-panel-2" : "border-line bg-panel"
              } ${t.status === "done" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-2.5">
                <StatusIcon status={t.status} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${t.status === "done" ? "text-muted line-through decoration-line" : ""}`}>
                    {t.title}
                  </p>
                  {t.note && <p className="mt-1 text-xs text-muted">{t.note}</p>}
                  <div className="mt-2">
                    <AgentBadge agent={t.agent} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusIcon({ status }: { status: Task["status"] }) {
  if (status === "done")
    return (
      <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" aria-label="Done">
        <circle cx="8" cy="8" r="7" fill="var(--analyst)" />
        <path d="M5 8.2l2 2 4-4.2" stroke="#0c0d0f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (status === "active")
    return <span className="pulse-dot mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-accent" aria-label="In progress" />;
  if (status === "blocked")
    return <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--writer)]" aria-label="Blocked" />;
  return <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-muted/60" aria-label="To do" />;
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
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" /> agents working
          </p>
        )}
        {state.summary && (
          <div className="rise mt-6 rounded-lg border border-[var(--analyst)]/40 bg-panel p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--analyst)]">Mission complete</p>
            <p className="mt-2 text-[15px] leading-relaxed">{state.summary}</p>
          </div>
        )}
        {state.status === "error" && (
          <div className="mt-6 rounded-lg border border-[var(--writer)]/50 bg-panel p-4 text-sm">
            <p className="font-medium text-[var(--writer)]">Run failed</p>
            <p className="mt-1 text-muted">{state.error}</p>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}

function FeedRow({ item, onOpen }: { item: FeedItem; onOpen: (id: string) => void }) {
  switch (item.kind) {
    case "thought":
      return (
        <li className="rise border-l border-line pl-3 text-sm italic leading-relaxed text-muted">
          <span className="mr-2 font-mono text-[10px] not-italic uppercase tracking-wider">reasoning</span>
          {item.text}
        </li>
      );
    case "say":
      return <li className="rise whitespace-pre-wrap text-[15px] leading-relaxed">{item.text.trim()}</li>;
    case "task":
      return (
        <li className="rise flex items-center gap-2 font-mono text-xs text-muted">
          <StatusIcon status={item.status} />
          {item.text}
        </li>
      );
    case "search":
      return (
        <li className="rise rounded-lg border border-line bg-panel p-3">
          <div className="flex items-start gap-2 text-sm">
            <svg className="mt-[3px] shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5" stroke="var(--researcher)" strokeWidth="1.6" />
              <path d="M11 11l3.5 3.5" stroke="var(--researcher)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p className="min-w-0">
              <span className="text-muted">Searching</span> {item.query}
            </p>
          </div>
          {item.sources.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.sources.slice(0, 6).map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-[240px] truncate rounded border border-line px-2 py-0.5 text-xs text-muted hover:text-text"
                    title={s.title}
                  >
                    {hostname(s.url)} · {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    case "deliverable":
      return (
        <li className="rise">
          <button
            onClick={() => onOpen(item.deliverableId)}
            className="flex w-full items-center gap-3 rounded-lg border border-accent/40 bg-panel px-3 py-2.5 text-left hover:border-accent"
          >
            <DocIcon />
            <span className="text-sm">
              <span className="text-muted">Delivered</span> {item.title}
            </span>
            <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-xs text-accent">Open →</span>
          </button>
        </li>
      );
  }
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
        <Empty text={running ? "Finished work will appear here." : "Nothing delivered yet."} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((d) => (
            <li key={d.id} className="rise">
              <button
                onClick={() => onOpen(d)}
                className="w-full rounded-lg border border-line bg-panel p-3 text-left hover:border-accent/60"
              >
                <div className="flex items-center gap-2">
                  <DocIcon />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{d.kind}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{preview(d.content)}</p>
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose} role="dialog" aria-modal>
      <div
        className="rise flex h-full w-full max-w-3xl flex-col border-l border-line bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{deliverable.kind}</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(deliverable.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="rounded-md border border-line px-3 py-1 text-sm hover:bg-panel-2"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={download} className="rounded-md border border-line px-3 py-1 text-sm hover:bg-panel-2">
              Download .md
            </button>
            <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted hover:text-text" aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <article className="md scroll-thin flex-1 overflow-y-auto px-6 py-6 sm:px-10">
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
      <h2 className="font-mono text-xs uppercase tracking-wider text-muted">{title}</h2>
      {meta && <span className="font-mono text-xs text-muted">{meta}</span>}
    </div>
  );
}

function Empty({ text, pulse }: { text: string; pulse?: boolean }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
      {pulse && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />}
      {text}
    </p>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 1.5h5.5L13 5v9.5H4z" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 1.5V5H13" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const preview = (md: string) =>
  md
    .replace(/[#>*_`|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
