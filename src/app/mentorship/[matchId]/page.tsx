import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import GoalsPanel from "@/components/GoalsPanel";
import SessionsPanel, { type Session } from "@/components/SessionsPanel";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mentorship" };

type Named = { full_name: string | null } | null;
type Match = {
  id: string;
  status: "pending" | "active" | "ended";
  mentor_id: string;
  mentee_id: string;
  mentor: Named;
  mentee: Named;
};

export default async function MentorshipPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("matches")
    .select("id, status, mentor_id, mentee_id, mentor:profiles!matches_mentor_id_fkey(full_name), mentee:profiles!matches_mentee_id_fkey(full_name)")
    .eq("id", matchId)
    .maybeSingle();
  if (!data) notFound();
  const match = data as unknown as Match;

  const isMentee = match.mentee_id === user.id;
  const other = (isMentee ? match.mentor : match.mentee)?.full_name ?? "Your match";

  if (match.status !== "active") {
    return (
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold">Mentorship with {other}</h1>
        <p className="mt-3">
          {match.status === "pending"
            ? "This request is waiting for the mentor to accept. Goals and sessions unlock once it is accepted."
            : "This mentorship has ended."}
        </p>
        <Link href="/dashboard" className="btn btn-ghost mt-6">Back to dashboard</Link>
      </div>
    );
  }

  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase.from("goals").select("id, title, done").eq("match_id", matchId).order("created_at"),
    supabase.from("sessions").select("id, starts_at, duration_min, topic, notes, status").eq("match_id", matchId).order("starts_at"),
  ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  let reviewedIds: string[] = [];
  if (sessionIds.length) {
    const { data: reviews } = await supabase.from("reviews").select("session_id").in("session_id", sessionIds);
    reviewedIds = (reviews ?? []).map((r) => r.session_id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
          <h1 className="font-display text-3xl font-bold">
            {isMentee ? "Your mentor" : "Your mentee"}: {other}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/chat/${matchId}`} className="btn btn-primary">Open chat</Link>
          <Link href={`/session/${matchId}`} className="btn btn-ghost">Video room</Link>
        </div>
      </div>

      <GoalsPanel matchId={matchId} initial={goals ?? []} />
      <SessionsPanel
        matchId={matchId}
        userId={user.id}
        mentorId={match.mentor_id}
        isMentee={isMentee}
        initial={(sessions ?? []) as Session[]}
        reviewedIds={reviewedIds}
      />
    </div>
  );
}
