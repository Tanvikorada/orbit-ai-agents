import {
  ArrowRight,
  Brain,
  Eye,
  GithubLogo,
  Link as LinkIcon,
  ListChecks,
  MagnifyingGlass,
  Package,
  PencilSimpleLine,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { DeliverablePreview } from "@/components/landing/DeliverablePreview";
import { GoalForm } from "@/components/landing/GoalForm";
import { HeroReplay } from "@/components/landing/HeroReplay";
import { Reveal } from "@/components/landing/Reveal";
import { FeedRow, TaskList } from "@/components/mission";
import { AGENT_COLOR, Logo } from "@/components/ui";
import type { AgentRole, Task } from "@/lib/events";

const REPO = "https://github.com/Tanvikorada/orbit-ai-agents";

const STACK = [
  { slug: "nextdotjs", name: "Next.js" },
  { slug: "typescript", name: "TypeScript" },
  { slug: "googlegemini", name: "Google Gemini" },
  { slug: "anthropic", name: "Anthropic Claude" },
  { slug: "vercel", name: "Vercel" },
  { slug: "tailwindcss", name: "Tailwind CSS" },
];

const STEPS = [
  {
    icon: ListChecks,
    title: "Plan",
    body: "Your goal becomes a short mission plan, and every task gets an owner.",
  },
  {
    icon: MagnifyingGlass,
    title: "Research",
    body: "The Researcher searches the live web and keeps the sources it reads.",
  },
  {
    icon: PencilSimpleLine,
    title: "Build",
    body: "Analyst, Strategist and Writer turn findings into tables, plans and drafts.",
  },
  {
    icon: Package,
    title: "Deliver",
    body: "Each finished piece lands as a clean document you can copy or download.",
  },
];

const TRUST = [
  { icon: LinkIcon, title: "Real sources", body: "Research runs on live web search, and deliverables cite the pages they used." },
  { icon: Eye, title: "Visible reasoning", body: "Short reasoning notes stream into the feed, so every decision is explainable." },
  { icon: ShieldCheck, title: "Honest output", body: "Agents flag what they could not verify and never invent contact details." },
  { icon: Brain, title: "Two AI engines", body: "Runs free on Google Gemini, or on Claude, behind the same mission engine." },
];

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <Nav />

      {/* Hero: asymmetric split, product running live on the right */}
      <header className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pt-20">
        <div className="glow pointer-events-none absolute -left-40 top-0 h-[520px] w-[720px]" />
        <div className="relative min-w-0 lg:col-span-6">
          <Reveal onMount>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tighter sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
              Say the outcome.
              <br />
              <span className="text-muted">Get the finished work.</span>
            </h1>
          </Reveal>
          <Reveal onMount delay={0.1}>
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted">
              Orbit&apos;s AI agents plan the task, research the live web and hand back work you can send today.
            </p>
          </Reveal>
          <Reveal onMount delay={0.2}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98]"
              >
                Launch a run <ArrowRight size={16} weight="bold" />
              </Link>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 transition hover:bg-panel-2 active:scale-[0.98]"
              >
                <GithubLogo size={18} /> View source
              </a>
            </div>
          </Reveal>
        </div>
        <Reveal onMount delay={0.15} className="relative min-w-0 lg:col-span-6">
          <HeroReplay />
        </Reveal>
      </header>

      {/* Built with */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
          <p className="shrink-0 text-sm text-muted">Built with</p>
          <ul className="grid grid-cols-3 items-center gap-x-10 gap-y-6 sm:grid-cols-6">
            {STACK.map((s) => (
              <li key={s.slug} className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://cdn.simpleicons.org/${s.slug}/8d8b85`}
                  alt={s.name}
                  title={s.name}
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 opacity-80 transition hover:opacity-100"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How a run works: sticky heading + steps */}
      <section id="how" className="mx-auto grid max-w-7xl scroll-mt-20 grid-cols-1 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:py-32">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From one sentence to finished work</h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-muted">
              You watch the whole run as it happens: the plan, every search, and each deliverable the moment it ships.
            </p>
          </div>
        </div>
        <ol className="relative flex flex-col gap-4 lg:col-span-7">
          <span className="absolute bottom-8 left-[27px] top-8 w-px bg-line" aria-hidden />
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <li className="relative flex gap-5 rounded-2xl p-3 transition-colors hover:bg-panel/60">
                <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-panel text-accent">
                  <Icon size={20} />
                </span>
                <div className="pt-1.5">
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="mt-1.5 max-w-[52ch] leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* The team: bento of the four agents, each showing what it produces */}
      <section id="agents" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6 lg:pb-32">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Four specialists, one shared plan</h2>
          <p className="mt-4 max-w-[60ch] leading-relaxed text-muted">
            Every task has an owner, so you can see who is doing what instead of reading one long chat reply.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <AgentCell role="Researcher" className="md:col-span-4" summary="Searches the live web and reads the sources.">
            <ol className="flex flex-col gap-2">
              <FeedRow
                compact
                item={{
                  id: 1,
                  kind: "search",
                  query: "D2C skincare brands India Series A funding 2026",
                  sources: [
                    { title: "Tracxn", url: "https://tracxn.com" },
                    { title: "Inc42", url: "https://inc42.com" },
                    { title: "YourStory", url: "https://yourstory.com" },
                  ],
                }}
              />
              <FeedRow
                compact
                item={{
                  id: 2,
                  kind: "thought",
                  text: "Three brands raised in the last six months. Funding news is the best opening for outreach.",
                }}
              />
            </ol>
          </AgentCell>

          <AgentCell role="Analyst" className="md:col-span-2" summary="Scores, ranks and compares options.">
            <div className="md text-xs">
              <table>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Fit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supabase</td>
                    <td>Best</td>
                  </tr>
                  <tr>
                    <td>Firebase</td>
                    <td>Good</td>
                  </tr>
                  <tr>
                    <td>Appwrite</td>
                    <td>Fair</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AgentCell>

          <AgentCell role="Strategist" className="md:col-span-2" summary="Turns findings into plans with owners.">
            <TaskList compact tasks={PLAN} />
          </AgentCell>

          <AgentCell role="Writer" className="md:col-span-4" summary="Drafts the emails, briefs and scripts you send.">
            <div className="rounded-xl border border-line bg-bg/70 p-4 text-sm leading-relaxed">
              <p className="text-muted">
                <span className="text-text">Subject:</span> Congrats on the Series A
              </p>
              <p className="mt-3">
                Hi [First name], congratulations on the round. Skincare brands at your stage usually hit the same wall
                next: keeping acquisition costs down while moving into new cities.
              </p>
              <p className="mt-3 text-muted">Would a 15-minute call next week be useful?</p>
            </div>
          </AgentCell>
        </div>
      </section>

      {/* Deliverable showcase: real screenshot */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:pb-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Work you can actually send</h2>
          <p className="mx-auto mt-4 max-w-[58ch] leading-relaxed text-muted">
            Every deliverable is clean Markdown with its sources. Copy it, download it, or paste it into Docs or Notion.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="relative mt-12">
          <div className="glow pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[900px] -translate-x-1/2" />
          <div className="relative mx-auto max-w-4xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
            <DeliverablePreview />
          </div>
        </Reveal>
      </section>

      {/* Trust: icon grid without cards */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-28">
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Built to be trusted, not just to look busy
            </h2>
          </Reveal>
          <dl className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <Icon size={24} className="text-accent" />
                <dt className="mt-4 font-medium">{title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-panel px-6 py-16 text-center sm:px-12">
          <div className="glow pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[680px] -translate-x-1/2" />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-5xl">Give Orbit a goal</h2>
          <p className="relative mx-auto mt-4 max-w-[48ch] text-muted">
            Describe what you need done. Watch the team plan it, research it and deliver it.
          </p>
          <div className="relative mx-auto mt-8 max-w-2xl">
            <GoalForm />
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <p className="sm:ml-4">Multi-agent AI workspace</p>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 transition hover:text-text sm:ml-auto"
          >
            <GithubLogo size={16} /> Built by @Tanvikorada
          </a>
        </div>
      </footer>
    </div>
  );
}

const PLAN: Task[] = [
  { id: "p1", title: "Shortlist 10 funded brands", agent: "Researcher", status: "done" },
  { id: "p2", title: "Write a 14-day outreach plan", agent: "Strategist", status: "active" },
  { id: "p3", title: "Draft follow-up emails", agent: "Writer", status: "todo" },
];

function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" aria-label="Orbit home">
          <Logo className="text-lg" />
        </Link>
        <div className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#how" className="transition hover:text-text">
            How it works
          </a>
          <a href="#agents" className="transition hover:text-text">
            Agents
          </a>
          <a href={REPO} target="_blank" rel="noreferrer" className="transition hover:text-text">
            GitHub
          </a>
        </div>
        <Link
          href="/workspace"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-text px-4 py-2 text-sm font-medium text-bg transition hover:bg-white active:scale-[0.98]"
        >
          Launch a run
        </Link>
      </div>
    </nav>
  );
}

function AgentCell({
  role,
  summary,
  className = "",
  children,
}: {
  role: AgentRole;
  summary: string;
  className?: string;
  children: React.ReactNode;
}) {
  const color = AGENT_COLOR[role];
  return (
    <Reveal className={className}>
      <div
        className="flex h-full flex-col gap-6 rounded-2xl border border-line p-6"
        style={{
          background: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${color} 12%, transparent), transparent 60%), var(--panel)`,
        }}
      >
        <div>
          <h3 className="text-lg font-medium" style={{ color }}>
            {role}
          </h3>
          <p className="mt-1.5 text-sm text-muted">{summary}</p>
        </div>
        <div className="mt-auto">{children}</div>
      </div>
    </Reveal>
  );
}
