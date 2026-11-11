import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, RunStatusIcon, type SavedRunStatus } from "@/components/RunBits";
import type { Deliverable, Task } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import { SavedRun } from "./SavedRun";

export const metadata = { title: "Run | Orbit" };

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/runs/${id}`);

  // Row-level security already limits this to the signed-in user's runs.
  const { data: run } = await supabase
    .from("runs")
    .select("id, goal, status, summary, error, tasks, deliverables, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!run) notFound();

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/runs" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text">
          <ArrowLeft size={14} /> My runs
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <span className="mt-1.5">
            <RunStatusIcon status={run.status as SavedRunStatus} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">{run.goal}</h1>
            <time dateTime={run.created_at} className="mt-2 block text-sm text-muted">
              {formatDate(run.created_at)}
            </time>
          </div>
        </div>
        <SavedRun
          summary={run.summary}
          error={run.error}
          tasks={(run.tasks ?? []) as Task[]}
          deliverables={(run.deliverables ?? []) as Deliverable[]}
        />
      </main>
    </div>
  );
}
