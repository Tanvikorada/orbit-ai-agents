"use client";

import { ClockCounterClockwise, SignOut } from "@phosphor-icons/react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (user === undefined) return <span className="h-8 w-8" aria-hidden />;
  if (!user)
    return (
      <Link href="/login" className="whitespace-nowrap text-sm text-muted transition hover:text-text">
        Sign in
      </Link>
    );

  const label = user.email ?? "Account";
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-panel-2 text-sm font-medium uppercase transition hover:border-accent/60"
      >
        {label[0]}
      </button>
      {open && (
        <div className="rise absolute right-0 top-10 z-40 w-56 overflow-hidden rounded-xl border border-line bg-panel shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
          <p className="truncate border-b border-line px-4 py-3 text-xs text-muted">{label}</p>
          <Link
            href="/runs"
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-panel-2"
            onClick={() => setOpen(false)}
          >
            <ClockCounterClockwise size={16} /> My runs
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-panel-2">
              <SignOut size={16} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
