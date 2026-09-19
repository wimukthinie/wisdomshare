import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SessionPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Row Level Security only returns the match if this user is a participant.
  const { data: match } = await supabase.from("matches").select("id").eq("id", matchId).maybeSingle();
  if (!match) notFound();

  const room = `mentorhub-${matchId}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Video session</h1>
        <Link href={`/chat/${matchId}`} className="btn btn-ghost">Back to chat</Link>
      </div>
      <iframe
        title="Video session"
        src={`https://meet.jit.si/${room}#config.prejoinPageEnabled=false`}
        allow="camera; microphone; fullscreen; display-capture"
        className="h-[70vh] w-full rounded-xl border border-line"
      />
    </div>
  );
}
