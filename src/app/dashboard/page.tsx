import Link from "next/link";
import { redirect } from "next/navigation";
import AcceptButton from "@/components/AcceptButton";
import LocalTime from "@/components/LocalTime";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

type Named = { full_name: string | null } | null;
type Match = {
  id: string;
  status: "pending" | "active" | "ended";
  mentor_id: string;
  mentee_id: string;
  mentor: Named;
  mentee: Named;
};
type Upcoming = { id: string; match_id: string; starts_at: string; topic: string | null };

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60 * 1000).toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("matches")
    .select("id, status, mentor_id, mentee_id, mentor:profiles!matches_mentor_id_fkey(full_name), mentee:profiles!matches_mentee_id_fkey(full_name)")
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  const matches = (data ?? []) as unknown as Match[];

  const nameFor = (m: Match) => ((m.mentor_id === user.id ? m.mentee : m.mentor)?.full_name ?? "Unknown");

  const activeIds = matches.filter((m) => m.status === "active").map((m) => m.id);
  let upcoming: Upcoming[] = [];
  if (activeIds.length) {
    const { data: s } = await supabase
      .from("sessions")
      .select("id, match_id, starts_at, topic")
      .in("match_id", activeIds)
      .eq("status", "scheduled")
      .gte("starts_at", oneHourAgo())
      .order("starts_at")
      .limit(5);
    upcoming = (s ?? []) as Upcoming[];
  }

  const pendingForMe = matches.filter((m) => m.status === "pending" && m.mentor_id === user.id).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        {pendingForMe > 0 && (
          <p role="status" className="mt-2 rounded-md bg-sun/30 px-3 py-2">
            You have {pendingForMe} new mentorship {pendingForMe === 1 ? "request" : "requests"} waiting for your answer.
          </p>
        )}
      </div>

      <section>
        <h2 className="font-display text-xl font-bold">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3">No sessions booked. Open a mentorship below to schedule one.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((s) => {
              const match = matches.find((m) => m.id === s.match_id)!;
              return (
                <li key={s.id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold"><LocalTime iso={s.starts_at} /> with {nameFor(match)}</p>
                    {s.topic && <p>{s.topic}</p>}
                  </div>
                  <Link href={`/session/${s.match_id}`} className="btn btn-primary">Join video</Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Your mentorships</h2>
        {matches.length === 0 ? (
          <p className="mt-3">
            You have no mentorships yet. <Link href="/mentors" className="font-semibold underline">Find a mentor</Link> to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {matches.map((m) => {
              const isMentor = m.mentor_id === user.id;
              return (
                <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">{nameFor(m)}</p>
                    <p className="text-sm">
                      {isMentor ? "You are the mentor" : "You are the mentee"}
                      {m.status === "pending" && (isMentor ? ", waiting for your answer" : ", waiting for the mentor")}
                      {m.status === "ended" && ", ended"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.status === "pending" && isMentor && <AcceptButton matchId={m.id} />}
                    {m.status === "active" && (
                      <>
                        <Link href={`/mentorship/${m.id}`} className="btn btn-primary">Goals and sessions</Link>
                        <Link href={`/chat/${m.id}`} className="btn btn-ghost">Chat</Link>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
