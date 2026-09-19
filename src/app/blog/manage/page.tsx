import Link from "next/link";
import { redirect } from "next/navigation";
import LocalTime from "@/components/LocalTime";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My articles" };

export default async function ManagePostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, published, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });
  const posts = data ?? [];

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">My articles</h1>
        <Link href="/blog/new" className="btn btn-primary">Write an article</Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-8">You have not written anything yet. Share what you know with mentees.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">{p.title}</p>
                <p className="text-sm text-ink/70">
                  {p.published ? "Published" : "Draft"}, <LocalTime iso={p.created_at} />
                </p>
              </div>
              <div className="flex gap-2">
                {p.published && <Link href={`/blog/${p.slug}`} className="btn btn-ghost">View</Link>}
                <Link href={`/blog/edit/${p.id}`} className="btn btn-primary">Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
