"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useReducer, useRef, useState } from "react";
import { FeedRow, TaskList } from "@/components/mission";
import { runDemo } from "@/lib/demo";
import { initial, reducer } from "@/lib/useRun";

const GOAL = "Land 5 pilot customers for our AI scheduling tool in 30 days";

// The real workspace components, driven by the scripted demo run in the browser.
// It plays only while visible and loops; with reduced motion it shows the finished state.
export function HeroReplay() {
  const [state, dispatch] = useReducer(reducer, initial);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    (async () => {
      do {
        dispatch({ type: "begin", goal: GOAL });
        await runDemo(GOAL, (event) => dispatch({ type: "event", event }), controller.signal, reduce ? 0 : 0.85);
        if (reduce) return;
        await new Promise((r) => setTimeout(r, 5000));
      } while (!controller.signal.aborted);
    })().catch(() => {
      // aborted when scrolled out of view
    });
    return () => controller.abort();
  }, [visible, reduce]);

  const done = state.tasks.filter((t) => t.status === "done").length;
  const feed = state.feed.filter((f) => f.kind !== "task").slice(-6);

  return (
    <div
      ref={ref}
      aria-label="Live replay of an Orbit run"
      className="relative overflow-hidden rounded-2xl border border-line bg-panel/70 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <p className="min-w-0 truncate text-sm">{GOAL}</p>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-xs text-muted">
          {state.status === "done" ? (
            <>
              <CheckCircle size={14} weight="fill" className="text-[var(--analyst)]" /> Complete
            </>
          ) : (
            <>
              <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Working
            </>
          )}
        </span>
      </div>

      <div className="grid h-[440px] grid-cols-1 gap-px bg-line sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="fade-bottom hidden overflow-hidden bg-bg/90 p-3 sm:block">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span>Mission board</span>
            {state.tasks.length > 0 && <span className="font-mono tabular-nums">{done}/{state.tasks.length}</span>}
          </div>
          {state.tasks.length > 0 ? (
            <TaskList tasks={state.tasks} compact />
          ) : (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shimmer h-16 rounded-xl border border-line" />
              ))}
            </div>
          )}
        </div>

        <div className="fade-top flex flex-col justify-end overflow-hidden bg-bg/90 p-3">
          <ol className="flex flex-col gap-2.5">
            {feed.map((item) => (
              <FeedRow key={item.id} item={item} compact />
            ))}
          </ol>
          {state.summary && (
            <p className="rise mt-3 rounded-xl border border-[var(--analyst)]/30 bg-[var(--analyst)]/[0.06] p-3 text-xs leading-relaxed">
              {state.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
