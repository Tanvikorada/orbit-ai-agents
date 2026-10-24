"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Deliverable, RunEvent, Source, Task } from "./events";

export type FeedItem =
  | { id: number; kind: "thought" | "say"; text: string }
  | { id: number; kind: "search"; query: string; sources: Source[] }
  | { id: number; kind: "task"; text: string; status: Task["status"] }
  | { id: number; kind: "deliverable"; title: string; deliverableId: string };

export interface RunState {
  status: "idle" | "running" | "done" | "error" | "stopped";
  mode: "live" | "demo" | null;
  goal: string;
  tasks: Task[];
  feed: FeedItem[];
  deliverables: Deliverable[];
  usage: { input: number; output: number };
  summary: string;
  error: string;
  startedAt: number;
  endedAt: number;
}

const initial: RunState = {
  status: "idle",
  mode: null,
  goal: "",
  tasks: [],
  feed: [],
  deliverables: [],
  usage: { input: 0, output: 0 },
  summary: "",
  error: "",
  startedAt: 0,
  endedAt: 0,
};

type Action =
  | { type: "begin"; goal: string }
  | { type: "event"; event: RunEvent }
  | { type: "end"; status: RunState["status"]; error?: string }
  | { type: "restore"; state: RunState };

let nextId = 1;

function reducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case "begin":
      return { ...initial, status: "running", goal: action.goal, startedAt: Date.now() };
    case "restore":
      return action.state;
    case "end":
      if (state.status !== "running") return state;
      return { ...state, status: action.status, error: action.error ?? state.error, endedAt: Date.now() };
    case "event":
      return applyEvent(state, action.event);
  }
}

function applyEvent(state: RunState, e: RunEvent): RunState {
  const push = (item: FeedItem) => ({ ...state, feed: [...state.feed, item] });
  switch (e.type) {
    case "start":
      return { ...state, mode: e.mode };
    case "thought":
    case "say": {
      const last = state.feed[state.feed.length - 1];
      if (last && last.kind === e.type) {
        const feed = state.feed.slice(0, -1);
        feed.push({ ...last, text: last.text + e.text });
        return { ...state, feed };
      }
      return push({ id: nextId++, kind: e.type, text: e.text });
    }
    case "tasks":
      return {
        ...push({ id: nextId++, kind: "task", text: `Mission plan created: ${e.tasks.length} tasks`, status: "todo" }),
        tasks: e.tasks,
      };
    case "task_update": {
      const task = state.tasks.find((t) => t.id === e.id);
      const tasks = state.tasks.map((t) => (t.id === e.id ? { ...t, status: e.status, note: e.note } : t));
      const verb = e.status === "active" ? "Started" : e.status === "done" ? "Completed" : "Blocked";
      return {
        ...push({ id: nextId++, kind: "task", text: `${verb}: ${task?.title ?? e.id}`, status: e.status }),
        tasks,
      };
    }
    case "search":
      return push({ id: nextId++, kind: "search", query: e.query, sources: [] });
    case "sources": {
      // Attach to the most recent search that has no sources yet.
      const feed = [...state.feed];
      for (let i = feed.length - 1; i >= 0; i--) {
        const item = feed[i];
        if (item.kind === "search" && item.sources.length === 0) {
          feed[i] = { ...item, sources: e.sources };
          return { ...state, feed };
        }
      }
      return push({ id: nextId++, kind: "search", query: "Web search", sources: e.sources });
    }
    case "deliverable":
      return {
        ...push({ id: nextId++, kind: "deliverable", title: e.deliverable.title, deliverableId: e.deliverable.id }),
        deliverables: [...state.deliverables, e.deliverable],
      };
    case "usage":
      return { ...state, usage: { input: e.input, output: e.output } };
    case "done":
      return { ...state, summary: e.summary, status: "done", endedAt: Date.now() };
    case "error":
      return { ...state, status: "error", error: e.message, endedAt: Date.now() };
  }
}

const STORAGE_KEY = "orbit:last-run";

export function useRun() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // A ?goal= link starts a fresh run instead of restoring the last one.
      if (saved && !new URLSearchParams(window.location.search).has("goal")) {
        const parsed = JSON.parse(saved) as RunState;
        if (parsed.status !== "running") dispatch({ type: "restore", state: parsed });
      }
    } catch {
      // storage unavailable; start fresh
    }
  }, []);

  useEffect(() => {
    if (state.status === "idle" || state.status === "running") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [state]);

  const start = useCallback(async (goal: string, demo = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "begin", goal });

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, demo }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        dispatch({ type: "end", status: "error", error: body.error ?? `Request failed (${res.status})` });
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) dispatch({ type: "event", event: JSON.parse(line) as RunEvent });
        }
      }
      dispatch({ type: "end", status: "done" });
    } catch (err) {
      if (controller.signal.aborted) dispatch({ type: "end", status: "stopped" });
      else dispatch({ type: "end", status: "error", error: err instanceof Error ? err.message : "Connection lost" });
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => dispatch({ type: "restore", state: initial }), []);

  return { state, start, stop, reset };
}
