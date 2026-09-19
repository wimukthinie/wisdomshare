"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: String(form.get("full_name")), role: String(form.get("role")) },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      track("signup_completed", { role: String(form.get("role")) });
      if (!data.session) {
        setNotice("Check your email to confirm your account, then log in.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    if (!isSignup) track("login");
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    router.push(safeNext);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4">
      <h1 className="font-display text-3xl font-bold">
        {isSignup ? "Create your account" : "Log in"}
      </h1>

      {isSignup && (
        <>
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-semibold">Full name</label>
            <input id="full_name" name="full_name" required className="field" />
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">I want to join as</legend>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
                <input type="radio" name="role" value="mentee" defaultChecked /> Mentee
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
                <input type="radio" name="role" value="mentor" /> Mentor
              </label>
            </div>
          </fieldset>
        </>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold">Password</label>
        <input
          id="password" name="password" type="password" required minLength={8}
          autoComplete={isSignup ? "new-password" : "current-password"} className="field"
        />
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-pine">{notice}</p>}

      <button disabled={loading} className="btn btn-primary w-full">
        {loading ? "Please wait" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-sm">
        {isSignup ? (
          <>Already have an account? <Link href="/login" className="font-semibold underline">Log in</Link></>
        ) : (
          <>New here? <Link href="/signup" className="font-semibold underline">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
