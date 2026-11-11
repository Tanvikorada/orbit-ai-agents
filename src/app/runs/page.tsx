import { ArrowRight, FileText } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { formatDate, RunStatusIcon, type SavedRunStatus } from "@/components/RunBits";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My runs | Orbit" };

interface RunRow {
  id: string;
  goal: string;
  status: SavedRunStatus;
  deliverables: unknown[];
  created_at: string;
}

export default async function RunsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/runs");

  const { data, error } = await supabase
    .from("runs")
    .select("id, goal, status, deliverables, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const runs = (data ?? []) as RunRow[];

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">My runs</h1>
        <p className="mt-2 text-muted">Every live run you start is saved here with its deliverables.</p>

        {error && <p className="mt-8 text-sm text-[var(--writer)]">Could not load your runs. Refresh to try again.</p>}

        {!error && runs.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="text-muted">No saved runs yet.</p>
            <Link
              href="/workspace"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#14110a] transition hover:brightness-110"
            >
              Launch a run <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        )}

        <ul className="mt-10 flex flex-col gap-2">
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                href={`/runs/${run.id}`}
                className="group flex items-start gap-3 rounded-xl border border-line bg-panel p-4 transition hover:border-accent/50 hover:bg-panel-2"
              >
                <span className="mt-0.5">
                  <RunStatusIcon status={run.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug">{run.goal}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <time dateTime={run.created_at}>{formatDate(run.created_at)}</time>
                    <span className="inline-flex items-center gap-1">
                      <FileText size={12} /> {run.deliverables.length} deliverable{run.deliverables.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                <ArrowRight size={16} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-text" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
