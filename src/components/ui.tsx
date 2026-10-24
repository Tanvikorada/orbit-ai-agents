import type { AgentRole } from "@/lib/events";

export const AGENT_COLOR: Record<AgentRole, string> = {
  Researcher: "var(--researcher)",
  Strategist: "var(--strategist)",
  Analyst: "var(--analyst)",
  Writer: "var(--writer)",
};

export function AgentBadge({ agent }: { agent: AgentRole }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[11px]"
      style={{ color: AGENT_COLOR[agent] }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: AGENT_COLOR[agent] }} />
      {agent}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4" fill="var(--accent)" />
        <ellipse cx="12" cy="12" rx="10.5" ry="5" stroke="var(--text)" strokeOpacity="0.55" transform="rotate(-25 12 12)" />
      </svg>
      Orbit
    </span>
  );
}
