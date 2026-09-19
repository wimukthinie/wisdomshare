"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export default function RequestButton({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setState("loading");
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase.from("matches").insert({ mentor_id: mentorId, mentee_id: user.id });
    if (error) {
      setError(error.code === "23505" ? "You have already sent a request." : error.message);
      setState("idle");
      return;
    }
    track("mentor_requested", { mentor_id: mentorId });
    setState("sent");
  }

  return (
    <div>
      <button onClick={request} disabled={state !== "idle"} className="btn btn-primary">
        {state === "sent" ? "Request sent" : state === "loading" ? "Sending" : "Request mentorship"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
