"use client";

import { ArrowRight, CheckCircle, FileText, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { TaskList } from "@/components/mission";
import { Viewer } from "@/components/Viewer";
import type { Deliverable, Task } from "@/lib/events";

export function SavedRun({
  summary,
  error,
  tasks,
  deliverables,
}: {
  summary: string | null;
  error: string | null;
  tasks: Task[];
  deliverables: Deliverable[];
}) {
  const [open, setOpen] = useState<Deliverable | null>(null);

  return (
    <>
      {summary && (
        <div className="mt-8 rounded-2xl border border-[var(--analyst)]/30 bg-[var(--analyst)]/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--analyst)]">
            <CheckCircle size={16} weight="fill" /> Summary
          </p>
          <p className="mt-2 leading-relaxed">{summary}</p>
        </div>
      )}
      {error && (
        <div className="mt-8 rounded-2xl border border-[var(--writer)]/40 bg-[var(--writer)]/[0.06] p-5 text-sm">
          <p className="flex items-center gap-2 font-medium text-[var(--writer)]">
            <WarningCircle size={16} weight="fill" /> Run failed
          </p>
          <p className="mt-1 text-muted">{error}</p>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h2 className="mb-4 text-xs font-medium text-muted">Deliverables</h2>
          {deliverables.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              This run didn&apos;t deliver anything.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setOpen(d)}
                    className="group h-full w-full rounded-xl border border-line bg-panel p-4 text-left transition hover:border-accent/50 hover:bg-panel-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-accent" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{d.kind}</span>
                      <ArrowRight size={14} className="ml-auto text-muted transition group-hover:translate-x-0.5 group-hover:text-text" />
                    </div>
                    <p className="mt-2 font-medium leading-snug">{d.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-xs font-medium text-muted">Mission plan</h2>
          {tasks.length ? <TaskList tasks={tasks} /> : <p className="text-sm text-muted">No tasks recorded.</p>}
        </section>
      </div>

      {open && <Viewer deliverable={open} onClose={() => setOpen(null)} />}
    </>
  );
}
