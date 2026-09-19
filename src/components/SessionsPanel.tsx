"use client";

import Link from "next/link";
import { useState } from "react";
import LocalTime from "@/components/LocalTime";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export type Session = {
  id: string;
  starts_at: string;
  duration_min: number;
  topic: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
};

type Props = {
  matchId: string;
  userId: string;
  mentorId: string;
  isMentee: boolean;
  initial: Session[];
  reviewedIds: string[];
};

const byStart = (a: Session, b: Session) => a.starts_at.localeCompare(b.starts_at);

function ReviewForm({ sessionId, mentorId, userId, onDone }: {
  sessionId: string; mentorId: string; userId: string; onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      mentee_id: userId,
      rating: Number(form.get("rating")),
      comment: String(form.get("comment")).trim() || null,
    });
    setSaving(false);
    if (error) return setError(error.message);
    track("review_submitted");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-md bg-mist p-3">
      <p className="font-semibold">How was this session?</p>
      <label htmlFor={`rating-${sessionId}`} className="sr-only">Rating</label>
      <select id={`rating-${sessionId}`} name="rating" defaultValue="5" className="field max-w-48">
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Good</option>
        <option value="3">3 - Okay</option>
        <option value="2">2 - Poor</option>
        <option value="1">1 - Very poor</option>
      </select>
      <label htmlFor={`comment-${sessionId}`} className="sr-only">Comment</label>
      <textarea id={`comment-${sessionId}`} name="comment" rows={2} maxLength={500} className="field" placeholder="Optional comment for other mentees" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="btn btn-primary">{saving ? "Saving" : "Submit review"}</button>
    </form>
  );
}

function SessionItem({ session, matchId, userId, mentorId, isMentee, reviewed, onChange, onReviewed }: {
  session: Session; matchId: string; userId: string; mentorId: string; isMentee: boolean;
  reviewed: boolean; onChange: (s: Session) => void; onReviewed: () => void;
}) {
  const [notes, setNotes] = useState(session.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState(false);

  async function setStatus(status: Session["status"]) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("sessions").update({ status }).eq("id", session.id);
    if (error) return setError(error.message);
    onChange({ ...session, status });
  }

  async function saveNotes() {
    setError(null);
    setSavedNotes(false);
    const supabase = createClient();
    const { error } = await supabase.from("sessions").update({ notes }).eq("id", session.id);
    if (error) return setError(error.message);
    setSavedNotes(true);
    onChange({ ...session, notes });
  }

  return (
    <li className="rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold"><LocalTime iso={session.starts_at} /> for {session.duration_min} minutes</p>
          {session.topic && <p>{session.topic}</p>}
          {session.status !== "scheduled" && (
            <p className="text-sm text-ink/70">{session.status === "completed" ? "Completed" : "Cancelled"}</p>
          )}
        </div>
        {session.status === "scheduled" && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/session/${matchId}`} className="btn btn-primary">Join video</Link>
            <button onClick={() => setStatus("completed")} className="btn btn-ghost">Mark completed</button>
            <button onClick={() => setStatus("cancelled")} className="btn btn-ghost">Cancel</button>
          </div>
        )}
      </div>

      {session.status !== "cancelled" && (
        <div className="mt-3">
          <label htmlFor={`notes-${session.id}`} className="mb-1 block text-sm font-semibold">Shared notes</label>
          <textarea id={`notes-${session.id}`} value={notes} onChange={(e) => { setNotes(e.target.value); setSavedNotes(false); }}
            rows={3} className="field" placeholder="What was discussed and what happens next" />
          <div className="mt-2 flex items-center gap-3">
            <button onClick={saveNotes} className="btn btn-ghost">Save notes</button>
            {savedNotes && <span role="status" className="text-sm text-pine">Saved</span>}
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

      {session.status === "completed" && isMentee && !reviewed && (
        <ReviewForm sessionId={session.id} mentorId={mentorId} userId={userId} onDone={onReviewed} />
      )}
      {session.status === "completed" && reviewed && isMentee && (
        <p className="mt-3 text-sm text-pine">Thanks, your review is published on the mentor&apos;s profile.</p>
      )}
    </li>
  );
}

export default function SessionsPanel({ matchId, userId, mentorId, isMentee, initial, reviewedIds }: Props) {
  const [supabase] = useState(() => createClient());
  const [sessions, setSessions] = useState<Session[]>([...initial].sort(byStart));
  const [reviewed, setReviewed] = useState<string[]>(reviewedIds);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  async function book(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const start = new Date(String(form.get("starts_at")));
    if (isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      return setError("Choose a start time in the future.");
    }
    setBooking(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        match_id: matchId,
        starts_at: start.toISOString(),
        duration_min: Number(form.get("duration_min")),
        topic: String(form.get("topic")).trim() || null,
        created_by: userId,
      })
      .select("id, starts_at, duration_min, topic, notes, status")
      .single();
    setBooking(false);
    if (error) return setError(error.message);
    track("session_booked");
    setSessions((s) => [...s, data as Session].sort(byStart));
    formEl.reset();
  }

  const upcoming = sessions.filter((s) => s.status === "scheduled");
  const past = sessions.filter((s) => s.status !== "scheduled").reverse();

  const renderItem = (s: Session) => (
    <SessionItem key={s.id} session={s} matchId={matchId} userId={userId} mentorId={mentorId}
      isMentee={isMentee} reviewed={reviewed.includes(s.id)}
      onChange={(u) => setSessions((all) => all.map((x) => (x.id === u.id ? u : x)))}
      onReviewed={() => setReviewed((r) => [...r, s.id])} />
  );

  return (
    <section className="card">
      <h2 className="font-display text-xl font-bold">Sessions</h2>

      <form onSubmit={book} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_2fr_auto] md:items-end">
        <div>
          <label htmlFor="starts_at" className="mb-1 block text-sm font-semibold">Date and time</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="field" />
        </div>
        <div>
          <label htmlFor="duration_min" className="mb-1 block text-sm font-semibold">Length</label>
          <select id="duration_min" name="duration_min" defaultValue="45" className="field">
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>
        <div>
          <label htmlFor="topic" className="mb-1 block text-sm font-semibold">Topic (optional)</label>
          <input id="topic" name="topic" maxLength={120} className="field" placeholder="Review my CV" />
        </div>
        <button disabled={booking} className="btn btn-primary">{booking ? "Booking" : "Book session"}</button>
      </form>
      <p className="mt-2 text-sm text-ink/70">Times are shown in your local time zone.</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

      <h3 className="mt-6 font-semibold">Upcoming</h3>
      {upcoming.length === 0 ? (
        <p className="mt-2">Nothing booked. Pick a time above to schedule your next session.</p>
      ) : (
        <ul className="mt-2 space-y-3">{upcoming.map(renderItem)}</ul>
      )}

      {past.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold">Past</h3>
          <ul className="mt-2 space-y-3">{past.map(renderItem)}</ul>
        </>
      )}
    </section>
  );
}
