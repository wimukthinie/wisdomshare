import Link from "next/link";
import { redirect } from "next/navigation";
import PostEditor from "@/components/PostEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Write an article" };

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "mentor") {
    return (
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold">Mentors only</h1>
        <p className="mt-3">Articles are written by mentors. You can read them on the blog.</p>
        <Link href="/blog" className="btn btn-ghost mt-6">Go to the blog</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Write an article</h1>
      <PostEditor authorId={user.id} />
    </div>
  );
}
