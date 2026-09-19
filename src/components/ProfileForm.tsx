"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  role: string;
  initial: { full_name: string | null; headline: string | null; bio: string | null; skills: string[] | null };
};

export default function ProfileForm({ userId, role, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const skills = String(form.get("skills"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: String(form.get("full_name")).trim(),
        headline: String(form.get("headline")).trim() || null,
        bio: String(form.get("bio")).trim() || null,
        skills,
      })
      .eq("id", userId);

    setSaving(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "ok", text: "Profile saved." });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-semibold">Full name</label>
        <input id="full_name" name="full_name" required defaultValue={initial.full_name ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="headline" className="mb-1 block text-sm font-semibold">
          {role === "mentor" ? "Headline (what you do)" : "Headline (what you study or work on)"}
        </label>
        <input id="headline" name="headline" maxLength={100} defaultValue={initial.headline ?? ""} className="field"
          placeholder={role === "mentor" ? "Senior data engineer, 10 years in fintech" : "MSc student in software engineering"} />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-semibold">About you</label>
        <textarea id="bio" name="bio" rows={5} maxLength={1000} defaultValue={initial.bio ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="skills" className="mb-1 block text-sm font-semibold">Skills or topics (separate with commas)</label>
        <input id="skills" name="skills" defaultValue={(initial.skills ?? []).join(", ")} className="field"
          placeholder="Career planning, Python, Interview practice" />
      </div>

      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={`text-sm ${message.type === "error" ? "text-red-700" : "text-pine"}`}>
          {message.text}
        </p>
      )}
      <button disabled={saving} className="btn btn-primary">{saving ? "Saving" : "Save profile"}</button>
    </form>
  );
}
