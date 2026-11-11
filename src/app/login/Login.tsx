"use client";

import { ArrowRight, EnvelopeSimple, GoogleLogo, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui";
import { DAILY_RUN_LIMIT } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/workspace";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    params.get("error") ? "error" : "idle",
  );
  const [message, setMessage] = useState(
    params.get("error") ? "That sign-in link has expired or was opened in a different browser. Request a new one." : "",
  );

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage(
        error.status === 429
          ? "Too many sign-in emails were sent recently. Wait a few minutes, or continue with Google."
          : error.message,
      );
    } else {
      setState("sent");
    }
  };

  const google = async () => {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage("Google sign-in isn't available right now. Use the email link instead.");
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2" />
      <div className="relative w-full max-w-sm">
        <Link href="/" aria-label="Orbit home" className="inline-block">
          <Logo className="text-lg" />
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Sign in to Orbit</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Get {DAILY_RUN_LIMIT} live runs a day and keep every run and deliverable in your history.
        </p>

        {state === "sent" ? (
          <div className="rise mt-8 rounded-2xl border border-[var(--analyst)]/30 bg-[var(--analyst)]/[0.06] p-5">
            <p className="flex items-center gap-2 font-medium text-[var(--analyst)]">
              <EnvelopeSimple size={18} /> Check your email
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We sent a sign-in link to <span className="text-text">{email}</span>. Open it in this browser to finish
              signing in.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={google}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 transition hover:bg-panel-2 active:scale-[0.98]"
            >
              <GoogleLogo size={18} weight="bold" /> Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={sendLink} className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full border border-line bg-panel px-4 py-2.5 outline-none transition-colors focus:border-accent"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 font-medium text-[#14110a] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {state === "sending" ? "Sending link" : "Email me a sign-in link"}
                <ArrowRight size={16} weight="bold" />
              </button>
            </form>
          </>
        )}

        {state === "error" && (
          <p className="mt-4 flex items-start gap-2 text-sm text-[var(--writer)]">
            <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" /> {message}
          </p>
        )}
      </div>
    </main>
  );
}
