// Events streamed from /api/run to the workspace UI, one JSON object per line.

export const AGENTS = ["Researcher", "Strategist", "Analyst", "Writer"] as const;
export type AgentRole = (typeof AGENTS)[number];

export type TaskStatus = "todo" | "active" | "done" | "blocked";

export interface Task {
  id: string;
  title: string;
  agent: AgentRole;
  status: TaskStatus;
  note?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Deliverable {
  id: string;
  title: string;
  kind: string;
  content: string;
}

export type RunEvent =
  | { type: "start"; mode: "live" | "demo"; goal: string }
  | { type: "thought"; text: string }
  | { type: "say"; text: string }
  | { type: "tasks"; tasks: Task[] }
  | { type: "task_update"; id: string; status: TaskStatus; note?: string }
  | { type: "search"; query: string }
  | { type: "sources"; sources: Source[] }
  | { type: "deliverable"; deliverable: Deliverable }
  | { type: "usage"; input: number; output: number }
  | { type: "done"; summary: string }
  | { type: "error"; message: string };

export type Emit = (event: RunEvent) => void;
