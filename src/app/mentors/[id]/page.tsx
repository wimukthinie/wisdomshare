import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LocalTime from "@/components/LocalTime";
import RequestButton from "@/components/RequestButton";
import Stars from "@/components/Stars";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return { title: data?.full_name ?? "Mentor" };
}

export default async function MentorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("profiles")
    .select("id, full_name, headline, bio, skills")
    .eq("id", id)
    .eq("role", "mentor")
    .maybeSingle();
  if (!mentor) notFound();

  const { data: reviewData } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("mentor_id", id)
    .order("created_at", { ascending: false });
  const reviews = reviewData ?? [];
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="max-w-2xl">
      <Link href="/mentors" className="text-sm underline">All mentors</Link>
      <h1 className="mt-3 font-display text-4xl font-bold">{mentor.full_name}</h1>
      {mentor.headline && <p className="mt-1 text-lg font-semibold text-pine">{mentor.headline}</p>}
      {average !== null && <div className="mt-2"><Stars value={average} count={reviews.length} /></div>}

      {mentor.bio && <p className="mt-6 whitespace-pre-wrap text-lg">{mentor.bio}</p>}

      {mentor.skills && mentor.skills.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {mentor.skills.map((s: string) => (
            <li key={s} className="rounded-md bg-mist px-2 py-0.5 text-sm">{s}</li>
          ))}
        </ul>
      )}

      <div className="mt-8"><RequestButton mentorId={mentor.id} /></div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">What mentees say</h2>
        {reviews.length === 0 ? (
          <p className="mt-3">No reviews yet. Reviews appear after a mentee completes a session.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card">
                <Stars value={r.rating} />
                {r.comment && <p className="mt-2">{r.comment}</p>}
                <p className="mt-2 text-sm text-ink/70"><LocalTime iso={r.created_at} /></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
