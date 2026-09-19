import Link from "next/link";
import RequestButton from "@/components/RequestButton";
import Stars from "@/components/Stars";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Find a mentor" };

type Mentor = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
};

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string }>;
}) {
  const { q, skill } = await searchParams;
  const term = q?.replace(/[%,()]/g, "").trim();
  const supabase = await createClient();

  let query = supabase.from("profiles").select("id, full_name, headline, bio, skills").eq("role", "mentor");
  if (term) query = query.or(`full_name.ilike.%${term}%,headline.ilike.%${term}%`);
  const { data } = await query.order("full_name");
  const found = (data ?? []) as Mentor[];

  const allSkills = [...new Set(found.flatMap((m) => m.skills ?? []))].sort();
  const mentors = skill ? found.filter((m) => m.skills?.includes(skill)) : found;

  const ids = mentors.map((m) => m.id);
  const ratings = new Map<string, { sum: number; count: number }>();
  if (ids.length) {
    const { data: reviews } = await supabase.from("reviews").select("mentor_id, rating").in("mentor_id", ids);
    (reviews ?? []).forEach((r) => {
      const cur = ratings.get(r.mentor_id) ?? { sum: 0, count: 0 };
      ratings.set(r.mentor_id, { sum: cur.sum + r.rating, count: cur.count + 1 });
    });
  }

  const skillHref = (s?: string) => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (s) params.set("skill", s);
    const qs = params.toString();
    return qs ? `/mentors?${qs}` : "/mentors";
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Find a mentor</h1>

      <form className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search mentors</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or topic" className="field max-w-md" />
        {skill && <input type="hidden" name="skill" value={skill} />}
        <button className="btn btn-primary">Search</button>
      </form>

      {allSkills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Filter by skill">
          <li>
            <Link href={skillHref()} className={`btn ${!skill ? "btn-primary" : "btn-ghost"}`}>All</Link>
          </li>
          {allSkills.map((s) => (
            <li key={s}>
              <Link href={skillHref(s)} className={`btn ${skill === s ? "btn-primary" : "btn-ghost"}`}>{s}</Link>
            </li>
          ))}
        </ul>
      )}

      {mentors.length === 0 ? (
        <p className="mt-10">No mentors match your search yet. Try a broader term or clear the skill filter.</p>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {mentors.map((m) => {
            const r = ratings.get(m.id);
            return (
              <li key={m.id} className="card flex flex-col justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    <Link href={`/mentors/${m.id}`} className="hover:underline">{m.full_name ?? "Unnamed mentor"}</Link>
                  </h2>
                  {m.headline && <p className="font-semibold text-pine">{m.headline}</p>}
                  {r && <div className="mt-1"><Stars value={r.sum / r.count} count={r.count} /></div>}
                  {m.bio && <p className="mt-2 line-clamp-3">{m.bio}</p>}
                  {m.skills && m.skills.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {m.skills.map((s) => (
                        <li key={s} className="rounded-md bg-mist px-2 py-0.5 text-sm">{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <RequestButton mentorId={m.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
