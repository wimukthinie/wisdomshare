import Link from "next/link";
import LocalTime from "@/components/LocalTime";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Blog" };

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  created_at: string;
  author: { full_name: string | null } | null;
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isMentor = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isMentor = data?.role === "mentor";
  }

  const { data } = await supabase
    .from("posts")
    .select("slug, title, excerpt, created_at, author:profiles(full_name)")
    .eq("published", true)
    .order("created_at", { ascending: false });
  const posts = (data ?? []) as unknown as Post[];

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Blog</h1>
        {isMentor && <Link href="/blog/new" className="btn btn-primary">Write an article</Link>}
      </div>
      <p className="mt-2">Advice and stories from mentors on careers, study and research.</p>

      {posts.length === 0 ? (
        <p className="mt-8">No articles have been published yet.{isMentor && " Write the first one."}</p>
      ) : (
        <ul className="mt-8 divide-y divide-line">
          {posts.map((p) => (
            <li key={p.slug} className="py-6">
              <Link href={`/blog/${p.slug}`} className="font-display text-xl font-bold hover:underline">{p.title}</Link>
              <p className="text-sm text-ink/70">
                {p.author?.full_name && <>{p.author.full_name}, </>}
                <LocalTime iso={p.created_at} />
              </p>
              {p.excerpt && <p className="mt-2">{p.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
