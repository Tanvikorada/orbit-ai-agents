"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_COLOR, AgentBadge, Logo } from "@/components/ui";
import { EXAMPLE_GOALS } from "@/lib/examples";
import type { AgentRole } from "@/lib/events";

const TEAM: { role: AgentRole; does: string }[] = [
  { role: "Researcher", does: "Searches the live web, reads sources and pulls out facts worth acting on." },
  { role: "Analyst", does: "Scores, compares and ranks: accounts, vendors, options, numbers." },
  { role: "Strategist", does: "Turns findings into positioning, plans and decisions with owners and KPIs." },
  { role: "Writer", does: "Drafts the emails, one-pagers and scripts you can send today." },
];

export default function Home() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const launch = (demo = false) => {
    const g = goal.trim() || EXAMPLE_GOALS[0];
    router.push(`/workspace?goal=${encodeURIComponent(g)}${demo ? "&demo=1" : ""}`);
  };

  return (
    <div className="relative overflow-x-hidden">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-60" />

      <nav className="relative mx-auto flex max-w-6xl items-center px-4 py-5 sm:px-6">
        <Logo className="text-lg" />
        <Link
          href="/workspace"
          className="ml-auto rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel-2"
        >
          Open workspace
        </Link>
      </nav>

      <header className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">AI operations team</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Say the outcome.
          <br />
          <span className="text-muted">Get the finished work.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Orbit turns one sentence into a mission plan, runs live web research and hands back lead lists, outreach
          emails, briefs and plans you can use straight away. You watch every step as it happens.
        </p>

        <form
          className="mt-10 flex max-w-2xl flex-col gap-3 rounded-xl border border-line bg-panel p-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            launch();
          }}
        >
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={EXAMPLE_GOALS[0]}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted/60"
            aria-label="Describe your goal"
          />
          <button type="submit" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-black hover:brightness-110">
            Launch run
          </button>
        </form>
        <button onClick={() => launch(true)} className="mt-3 text-sm text-muted underline-offset-4 hover:text-text hover:underline">
          or watch a 30-second demo run →
        </button>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Preview />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Four specialists. One shared plan.
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Every task on the board has an owner, so you can see who is doing what and why, instead of reading one long
          chat reply.
        </p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {TEAM.map(({ role, does }) => (
            <div key={role} className="bg-bg p-6">
              <span className="block h-0.5 w-8" style={{ background: AGENT_COLOR[role] }} />
              <h3 className="mt-4 font-medium">{role}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{does}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 border-t border-line px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built to be trusted, not just to look busy.</h2>
        </div>
        <dl className="grid gap-8 sm:grid-cols-2">
          {[
            ["Live sources", "Research runs on real web search, and deliverables cite the URLs they used."],
            ["Visible reasoning", "Short reasoning summaries stream into the feed, so you can see why a choice was made."],
            ["Honest by default", "The agents mark what they could not verify, and never make up contact details."],
            ["Yours to keep", "Every deliverable is clean Markdown: copy it, download it, or paste it into Notion or Docs."],
          ].map(([t, d]) => (
            <div key={t}>
              <dt className="font-medium">{t}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p className="sm:ml-auto">Next.js · TypeScript · Gemini or Claude with tool use and live web search</p>
        </div>
      </footer>
    </div>
  );
}

function Preview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40" aria-hidden>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-3 truncate font-mono text-xs text-muted">orbit / workspace</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-xs">
          <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Working · 01:42
        </span>
      </div>
      <div className="grid gap-px bg-line md:grid-cols-[1fr_1.6fr_1fr]">
        <div className="bg-bg p-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Mission board · 2/5</p>
          {[
            ["Map the market and buyer profile", "Researcher", "done"],
            ["Shortlist high-fit accounts", "Analyst", "done"],
            ["Draft outreach sequence", "Writer", "active"],
            ["Build 14-day plan", "Strategist", "todo"],
          ].map(([t, a, s]) => (
            <div
              key={t}
              className={`mb-2 rounded-lg border p-2.5 ${s === "active" ? "border-accent/60 bg-panel-2" : "border-line bg-panel"} ${s === "done" ? "opacity-60" : ""}`}
            >
              <p className={`text-xs ${s === "done" ? "line-through" : ""}`}>{t}</p>
              <div className="mt-1.5">
                <AgentBadge agent={a as AgentRole} />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden bg-bg p-4 md:block">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Live feed</p>
          <div className="space-y-3 text-sm">
            <p className="border-l border-line pl-3 text-xs italic text-muted">
              Slow reply times are the sharpest pain, so the first email should open with speed-to-value.
            </p>
            <div className="rounded-lg border border-line bg-panel p-2.5 text-xs">
              <span className="text-muted">Searching</span> D2C skincare brands funding 2026
              <div className="mt-2 flex gap-1.5">
                <span className="rounded border border-line px-1.5 py-0.5 text-muted">inc42.com</span>
                <span className="rounded border border-line px-1.5 py-0.5 text-muted">yourstory.com</span>
                <span className="rounded border border-line px-1.5 py-0.5 text-muted">entrackr.com</span>
              </div>
            </div>
            <p>Shortlist ready: 10 brands scored on fit and timing. The Writer is drafting emails now.</p>
            <div className="flex items-center rounded-lg border border-accent/40 bg-panel px-3 py-2 text-xs">
              <span className="text-muted">Delivered</span>&nbsp;Target Account Shortlist
              <span className="ml-auto font-mono text-accent">Open →</span>
            </div>
          </div>
        </div>
        <div className="hidden bg-bg p-4 md:block">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Deliverables · 2</p>
          {[
            ["brief", "Market & Buyer Brief"],
            ["leads", "Target Account Shortlist"],
          ].map(([k, t]) => (
            <div key={t} className="mb-2 rounded-lg border border-line bg-panel p-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{k}</p>
              <p className="mt-1 text-xs font-medium">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
