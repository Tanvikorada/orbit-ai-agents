"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EXAMPLE_GOALS } from "@/lib/examples";

export function GoalForm() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const launch = () => {
    const g = goal.trim() || EXAMPLE_GOALS[0];
    router.push(`/workspace?goal=${encodeURIComponent(g)}`);
  };

  return (
    <form
      className="flex w-full flex-col gap-2 rounded-2xl border border-line bg-bg/80 p-2 transition-colors focus-within:border-accent/60 sm:flex-row sm:rounded-full"
      onSubmit={(e) => {
        e.preventDefault();
        launch();
      }}
    >
      <label htmlFor="landing-goal" className="sr-only">
        Describe your goal
      </label>
      <input
        id="landing-goal"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={EXAMPLE_GOALS[0]}
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[15px] outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-5 py-2.5 font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98]"
      >
        Launch a run <ArrowRight size={16} weight="bold" />
      </button>
    </form>
  );
}
