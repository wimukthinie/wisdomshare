import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";
import { createClient } from "@/lib/supabase/server";

type Named = { full_name: string | null } | null;
type Match = { id: string; mentor_id: string; mentor: Named; mentee: Named };

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("matches")
    .select(
      "id, mentor_id, mentor:profiles!matches_mentor_id_fkey(full_name), mentee:profiles!matches_mentee_id_fkey(full_name)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!data) notFound();
  const match = data as unknown as Match;
  const other = (match.mentor_id === user.id ? match.mentee : match.mentor)?.full_name ?? "Your match";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Chat with {other}</h1>
        <div className="flex gap-2">
          <Link href={`/mentorship/${matchId}`} className="btn btn-ghost">Goals and sessions</Link>
          <Link href={`/session/${matchId}`} className="btn btn-primary">Start video session</Link>
        </div>
      </div>
      <ChatRoom matchId={matchId} userId={user.id} />
    </div>
  );
}
