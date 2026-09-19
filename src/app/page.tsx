import Link from "next/link";
import HeroExperiment from "@/components/HeroExperiment";
import LocalTime from "@/components/LocalTime";
import { createClient } from "@/lib/supabase/server";

const steps = [
  { title: "Find a mentor", text: "Search by skill or field and read what each mentor can help with." },
  { title: "Send a request", text: "Ask to be matched. The mentor accepts and a private chat opens." },
  { title: "Meet and follow up", text: "Book a video session, set goals together and keep talking in the chat." },
];

type Mentor = { id: string; full_name: string | null; headline: string | null };
type Post = { slug: string; title: string; excerpt: string | null; created_at: string };

export default async function Home() {
  const supabase = await createClient();
  const [{ data: mentorData }, { data: postData }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, headline").eq("role", "mentor").limit(3),
    supabase.from("posts").select("slug, title, excerpt, created_at").eq("published", true)
      .order("created_at", { ascending: false }).limit(3),
  ]);
  const mentors = (mentorData ?? []) as Mentor[];
  const posts = (postData ?? []) as Post[];

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-12 md:grid-cols-2">
        <HeroExperiment />

        <div className="space-y-3 rounded-xl border border-line bg-white p-5" aria-label="Example conversation">
          <div className="max-w-[85%] rounded-lg bg-mist px-4 py-2">
            <p className="text-sm font-semibold">Priya, mentor</p>
            <p>Send me the draft before Thursday and we will go through it together.</p>
          </div>
          <div className="ml-auto max-w-[85%] rounded-lg bg-pine px-4 py-2 text-white">
            <p className="text-sm font-semibold">Daniel, mentee</p>
            <p>Done. I also added the two job posts I am comparing.</p>
          </div>
          <div className="ml-auto flex max-w-[85%] items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm">
            <span className="inline-block h-3 w-3 rounded-sm bg-sun" aria-hidden="true" />
            CV-draft-v2.pdf
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <p className="font-display text-3xl font-bold text-pine">{i + 1}</p>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-1">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {mentors.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">Mentors you can meet</h2>
            <Link href="/mentors" className="text-sm font-semibold underline">See all mentors</Link>
          </div>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {mentors.map((m) => (
              <li key={m.id} className="card">
                <Link href={`/mentors/${m.id}`} className="font-display text-lg font-bold hover:underline">
                  {m.full_name ?? "Unnamed mentor"}
                </Link>
                {m.headline && <p className="mt-1 text-pine">{m.headline}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">From the blog</h2>
            <Link href="/blog" className="text-sm font-semibold underline">All articles</Link>
          </div>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug} className="card">
                <Link href={`/blog/${p.slug}`} className="font-display text-lg font-bold hover:underline">{p.title}</Link>
                <p className="mt-1 text-sm text-ink/70"><LocalTime iso={p.created_at} /></p>
                {p.excerpt && <p className="mt-2 line-clamp-3">{p.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
