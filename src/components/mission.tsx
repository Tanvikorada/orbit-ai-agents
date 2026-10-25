"use client";

import {
  ArrowRight,
  CheckCircle,
  Circle,
  CircleNotch,
  FileText,
  MagnifyingGlass,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { AgentBadge } from "@/components/ui";
import type { Task } from "@/lib/events";
import type { FeedItem } from "@/lib/useRun";

// UI pieces shared by the workspace and the live replay on the landing page.

export function StatusIcon({ status, size = 16 }: { status: Task["status"]; size?: number }) {
  if (status === "done")
    return <CheckCircle size={size} weight="fill" className="shrink-0 text-[var(--analyst)]" aria-label="Done" />;
  if (status === "active")
    return <CircleNotch size={size} weight="bold" className="spin shrink-0 text-accent" aria-label="In progress" />;
  if (status === "blocked")
    return <WarningCircle size={size} weight="fill" className="shrink-0 text-[var(--writer)]" aria-label="Blocked" />;
  return <Circle size={size} className="shrink-0 text-muted/70" aria-label="To do" />;
}

const STATUS_ORDER: Task["status"][] = ["active", "todo", "blocked", "done"];

export function TaskList({ tasks, compact = false }: { tasks: Task[]; compact?: boolean }) {
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [tasks],
  );
  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((t) => (
        <li
          key={t.id}
          className={`rise rounded-xl border transition-colors duration-300 ${compact ? "p-2.5" : "p-3"} ${
            t.status === "active" ? "border-accent/50 bg-panel-2" : "border-line bg-panel"
          } ${t.status === "done" ? "opacity-65" : ""}`}
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5">
              <StatusIcon status={t.status} size={compact ? 14 : 16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`leading-snug ${compact ? "text-xs" : "text-sm"} ${t.status === "done" ? "text-muted" : ""}`}>
                {t.title}
              </p>
              {t.note && !compact && <p className="mt-1 text-xs text-muted">{t.note}</p>}
              <div className="mt-2">
                <AgentBadge agent={t.agent} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FeedRow({
  item,
  onOpen,
  compact = false,
}: {
  item: FeedItem;
  onOpen?: (id: string) => void;
  compact?: boolean;
}) {
  switch (item.kind) {
    case "thought":
      return (
        <li className={`rise border-l-2 border-line pl-3 italic leading-relaxed text-muted ${compact ? "text-xs" : "text-sm"}`}>
          {item.text.trim()}
        </li>
      );
    case "say":
      return (
        <li className={`rise whitespace-pre-wrap leading-relaxed ${compact ? "text-[13px]" : "text-[15px]"}`}>
          {item.text.trim()}
        </li>
      );
    case "task":
      return (
        <li className="rise flex items-center gap-2 font-mono text-xs text-muted">
          <StatusIcon status={item.status} size={14} />
          {item.text}
        </li>
      );
    case "search":
      return (
        <li className={`rise rounded-xl border border-line bg-panel ${compact ? "p-2.5" : "p-3"}`}>
          <div className={`flex items-start gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <MagnifyingGlass size={14} weight="bold" className="mt-[3px] shrink-0 text-[var(--researcher)]" />
            <p className="min-w-0">
              <span className="text-muted">Searching</span> {item.query}
            </p>
          </div>
          {item.sources.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.sources.slice(0, compact ? 3 : 6).map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={compact ? -1 : undefined}
                    className="block max-w-[220px] truncate rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition-colors hover:text-text"
                    title={s.title}
                  >
                    {hostname(s.url)}
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
            onClick={() => onOpen?.(item.deliverableId)}
            tabIndex={compact ? -1 : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl border border-accent/40 bg-panel text-left transition-colors hover:border-accent ${
              compact ? "px-2.5 py-2 text-xs" : "px-3 py-2.5 text-sm"
            }`}
          >
            <FileText size={16} className="shrink-0 text-accent" />
            <span className="min-w-0 truncate">
              <span className="text-muted">Delivered</span> {item.title}
            </span>
            <ArrowRight size={14} className="ml-auto shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
          </button>
        </li>
      );
  }
}

export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
