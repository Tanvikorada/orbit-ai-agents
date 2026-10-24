import { z } from "zod";
import { AGENTS, type Emit, type Task } from "./events";

// Provider-neutral pieces of the agent: system prompt, tool schemas and the
// executor that turns tool calls into UI events.

export const SYSTEM = `You are Orbit, an autonomous operations team made of four specialist agents: ${AGENTS.join(", ")}.
A user hands you a business goal. Deliver real, usable work for it, not advice about how they could do it themselves.

How you work:
1. Break the goal into 4-7 concrete tasks with create_tasks, each owned by the best-suited agent. Do this first.
2. Work through the tasks in order. Mark a task "active" with update_task when you start it and "done" (with a one-line note on the outcome) when it is finished.
3. Use web_search whenever current facts, companies, people, prices or examples would make the work better. Prefer specific, verifiable details and cite source URLs inside deliverables.
4. Publish every finished piece of work with publish_deliverable as polished Markdown: research briefs, lead lists as tables, outreach emails, plans, scripts, checklists. Each deliverable should stand on its own and be ready to use.
5. Between steps, write one or two short sentences saying what you are doing next, in plain language.
6. When everything is done, call finish with a short executive summary of what was delivered.

Keep deliverables concrete and honest: if something could not be verified, say so instead of inventing it. Never invent contact details such as personal email addresses or phone numbers.`;

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const MISSION_TOOLS: ToolSpec[] = [
  {
    name: "create_tasks",
    description:
      "Create the mission plan: the ordered list of tasks needed to reach the goal, each assigned to one agent. Call once, at the start.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short imperative task title" },
              agent: { type: "string", enum: [...AGENTS] },
            },
            required: ["title", "agent"],
          },
        },
      },
      required: ["tasks"],
    },
  },
  {
    name: "update_task",
    description:
      "Change a task's status. Use 'active' when starting it and 'done' with a one-line outcome note when finished.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task id returned by create_tasks, e.g. t1" },
        status: { type: "string", enum: ["active", "done", "blocked"] },
        note: { type: "string" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "publish_deliverable",
    description: "Publish a finished piece of work for the user as Markdown (brief, table, email draft, plan, script...).",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        kind: { type: "string", description: "One word: brief, leads, email, plan, analysis, script, checklist..." },
        content: { type: "string", description: "Full Markdown content" },
      },
      required: ["title", "kind", "content"],
    },
  },
  {
    name: "finish",
    description: "Call once all tasks are done, with a short executive summary of what was delivered.",
    parameters: {
      type: "object",
      properties: { summary: { type: "string" } },
      required: ["summary"],
    },
  },
];

const CreateTasksInput = z.object({
  tasks: z
    .array(z.object({ title: z.string().min(1), agent: z.enum(AGENTS) }))
    .min(1)
    .max(10),
});
const UpdateTaskInput = z.object({
  id: z.string(),
  status: z.enum(["active", "done", "blocked"]),
  note: z.string().optional(),
});
const PublishInput = z.object({
  title: z.string().min(1),
  kind: z.string().min(1),
  content: z.string().min(1),
});
const FinishInput = z.object({ summary: z.string().min(1) });

export interface ToolOutcome {
  content: string;
  is_error?: boolean;
}

export function createMission(emit: Emit) {
  const tasks = new Map<string, Task>();
  let deliverableCount = 0;
  const state = { finished: false };

  const invalid = (err: z.ZodError): ToolOutcome => ({ content: `Invalid input: ${err.message}`, is_error: true });

  function execute(name: string, input: unknown): ToolOutcome {
    switch (name) {
      case "create_tasks": {
        const parsed = CreateTasksInput.safeParse(input);
        if (!parsed.success) return invalid(parsed.error);
        const created = parsed.data.tasks.map((t, i): Task => ({
          id: `t${tasks.size + i + 1}`,
          title: t.title,
          agent: t.agent,
          status: "todo",
        }));
        created.forEach((t) => tasks.set(t.id, t));
        emit({ type: "tasks", tasks: [...tasks.values()] });
        return { content: JSON.stringify(created.map(({ id, title, agent }) => ({ id, title, agent }))) };
      }
      case "update_task": {
        const parsed = UpdateTaskInput.safeParse(input);
        if (!parsed.success) return invalid(parsed.error);
        const task = tasks.get(parsed.data.id);
        if (!task) return { content: `No task with id ${parsed.data.id}`, is_error: true };
        task.status = parsed.data.status;
        task.note = parsed.data.note;
        emit({ type: "task_update", ...parsed.data });
        return { content: "ok" };
      }
      case "publish_deliverable": {
        const parsed = PublishInput.safeParse(input);
        if (!parsed.success) return invalid(parsed.error);
        deliverableCount += 1;
        emit({ type: "deliverable", deliverable: { id: `d${deliverableCount}`, ...parsed.data } });
        return { content: `Published as d${deliverableCount}` };
      }
      case "finish": {
        const parsed = FinishInput.safeParse(input);
        if (!parsed.success) return invalid(parsed.error);
        state.finished = true;
        emit({ type: "done", summary: parsed.data.summary });
        return { content: "Run complete." };
      }
      default:
        return { content: `Unknown tool ${name}`, is_error: true };
    }
  }

  return { execute, state };
}
