import { CheckCircle, CircleNotch, StopCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export type SavedRunStatus = "running" | "done" | "error" | "stopped";

export function RunStatusIcon({ status }: { status: SavedRunStatus }) {
  if (status === "done") return <CheckCircle size={18} weight="fill" className="text-[var(--analyst)]" aria-label="Complete" />;
  if (status === "error") return <WarningCircle size={18} weight="fill" className="text-[var(--writer)]" aria-label="Failed" />;
  if (status === "stopped") return <StopCircle size={18} className="text-muted" aria-label="Stopped" />;
  return <CircleNotch size={18} className="text-accent" aria-label="Running or interrupted" />;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
