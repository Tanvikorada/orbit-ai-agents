import type { Emit, RunEvent, Task } from "./events";

// A scripted run used when no API key is configured, so the app is always
// explorable (for example on a public portfolio deploy).

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });

// `speed` scales every pause; 0 plays the whole run instantly (used for reduced motion).
export async function runDemo(goal: string, emit: Emit, signal: AbortSignal, speed = 1) {
  const sleep = (ms: number, s: AbortSignal) => pause(ms * speed, s);
  const short = goal.length > 70 ? goal.slice(0, 67) + "..." : goal;

  const tasks: Task[] = [
    { id: "t1", title: "Map the market and ideal customer profile", agent: "Researcher", status: "todo" },
    { id: "t2", title: "Shortlist high-fit target accounts", agent: "Analyst", status: "todo" },
    { id: "t3", title: "Define positioning and the core offer", agent: "Strategist", status: "todo" },
    { id: "t4", title: "Draft a 3-step outreach sequence", agent: "Writer", status: "todo" },
    { id: "t5", title: "Build a 14-day execution plan", agent: "Strategist", status: "todo" },
  ];

  const say = (text: string): RunEvent[] => text.split(/(?<= )/).map((w) => ({ type: "say", text: w }));
  const think = (text: string): RunEvent[] => text.split(/(?<= )/).map((w) => ({ type: "thought", text: w }));

  const script: Array<RunEvent | RunEvent[] | number> = [
    think("The goal needs research first, then targeting, positioning, outreach copy and a schedule. Five tasks keep it tight. "),
    400,
    { type: "tasks", tasks },
    say("Plan is set: five tasks across four agents. Starting with market research.\n\n"),
    { type: "task_update", id: "t1", status: "active" },
    { type: "search", query: "market size, buyer trends and growth benchmarks 2026" },
    1100,
    {
      type: "sources",
      sources: [
        { title: "Industry outlook report 2026", url: "https://example.com/outlook-2026" },
        { title: "Buyer survey: how teams evaluate vendors", url: "https://example.com/buyer-survey" },
        { title: "Category growth benchmarks", url: "https://example.com/benchmarks" },
      ],
    },
    { type: "search", query: "common pain points of buyers in this segment" },
    900,
    {
      type: "sources",
      sources: [
        { title: "Community thread: what we wish vendors knew", url: "https://example.com/thread" },
        { title: "Analyst note: switching triggers", url: "https://example.com/analyst-note" },
      ],
    },
    { type: "task_update", id: "t1", status: "done", note: "3 segments sized, top pain points ranked" },
    {
      type: "deliverable",
      deliverable: {
        id: "d1",
        title: "Market & ICP Brief",
        kind: "brief",
        content: `# Market & ICP Brief\n\n**Goal:** ${goal}\n\n## Ideal customer profile\n| Attribute | Target |\n|---|---|\n| Company size | 20-200 employees |\n| Buyer | Founder, Head of Ops or Growth lead |\n| Trigger | New funding, hiring spree, or a missed target |\n| Budget signal | Already paying for 2+ tools in the category |\n\n## Top pain points\n1. **Manual work that does not scale** - teams stitch together spreadsheets and copy-paste.\n2. **Slow response times** - leads go cold within 48 hours.\n3. **No single view of progress** - leaders cannot see what is working.\n\n## Why now\nBudgets are shifting from headcount to automation, and buyers expect results in weeks, not quarters.\n\n> Demo mode: figures and sources are illustrative. Add an API key to run live research.`,
      },
    },
    say("Research is in. Next, the Analyst is shortlisting accounts that fit the profile.\n\n"),
    { type: "task_update", id: "t2", status: "active" },
    { type: "search", query: "recently funded companies hiring operations roles" },
    1000,
    { type: "task_update", id: "t2", status: "done", note: "8 accounts scored by fit and timing" },
    {
      type: "deliverable",
      deliverable: {
        id: "d2",
        title: "Target Account Shortlist",
        kind: "leads",
        content: `# Target Account Shortlist\n\n| # | Account (example) | Why now | Fit |\n|---|---|---|---|\n| 1 | Northwind Labs | Raised Series A, hiring 3 ops roles | ★★★★★ |\n| 2 | Brightline Health | Expanding to 2 new regions | ★★★★☆ |\n| 3 | Kestrel Logistics | New COO, process overhaul | ★★★★☆ |\n| 4 | Parcel & Co | Public complaints about response times | ★★★☆☆ |\n| 5 | Lumen Studio | Doubled headcount this year | ★★★☆☆ |\n\n**Scoring:** fit with ICP (50%), timing trigger (30%), reachable decision maker (20%).\n\n> Demo mode: company names are fictional placeholders.`,
      },
    },
    { type: "task_update", id: "t3", status: "active" },
    think("Positioning should lead with speed-to-value, since slow response time is the sharpest pain. "),
    700,
    { type: "task_update", id: "t3", status: "done", note: "One-line positioning + 3 proof points" },
    { type: "task_update", id: "t4", status: "active" },
    say("Positioning locked. The Writer is drafting the outreach sequence now.\n\n"),
    900,
    { type: "task_update", id: "t4", status: "done", note: "Email 1, follow-up, break-up email" },
    {
      type: "deliverable",
      deliverable: {
        id: "d3",
        title: "Outreach Sequence",
        kind: "email",
        content: `# Outreach Sequence\n\n## Email 1 - Day 1\n**Subject:** {{company}}'s next 90 days\n\nHi {{first_name}},\n\nCongrats on {{trigger}}. Teams at this stage usually feel it first in response times: leads wait, deals cool.\n\nWe help teams like yours cut that to under an hour without adding headcount. Worth a 15-minute look next week?\n\n## Email 2 - Day 4\n**Subject:** Re: {{company}}'s next 90 days\n\nQuick example: a team of 40 went from 2-day to 40-minute replies in three weeks. Happy to share how.\n\n## Email 3 - Day 9\n**Subject:** Close the loop?\n\nIf now is not the time, no problem. Should I check back next quarter?`,
      },
    },
    { type: "task_update", id: "t5", status: "active" },
    800,
    { type: "task_update", id: "t5", status: "done", note: "Day-by-day plan with owners and KPIs" },
    {
      type: "deliverable",
      deliverable: {
        id: "d4",
        title: "14-Day Execution Plan",
        kind: "plan",
        content: `# 14-Day Execution Plan\n\n| Days | Focus | Output | KPI |\n|---|---|---|---|\n| 1-2 | Finalize list, verify contacts | 50 verified accounts | 90% data accuracy |\n| 3-5 | Send Email 1 in batches | 50 sends | 45% open rate |\n| 6-8 | Follow-ups + LinkedIn touch | 2nd touch on all | 8% reply rate |\n| 9-11 | Break-up email, book calls | Calendar invites | 5 calls booked |\n| 12-14 | Review, iterate copy | Learnings doc | 2 qualified opps |\n\n**Weekly check-in:** review reply rate by segment and rewrite the weakest email.`,
      },
    },
    { type: "done", summary: `Delivered a market brief, a scored account shortlist, a 3-email outreach sequence and a 14-day plan for: "${short}".` },
  ];

  emit({ type: "start", mode: "demo", goal });
  let output = 0;
  for (const step of script) {
    if (typeof step === "number") {
      await sleep(step, signal);
      continue;
    }
    for (const event of Array.isArray(step) ? step : [step]) {
      emit(event);
      output += 12;
      await sleep(event.type === "say" || event.type === "thought" ? 28 : 350, signal);
    }
    emit({ type: "usage", input: 4200 + output * 3, output });
  }
}
