import { notFound, redirect } from "next/navigation";
import PostEditor from "@/components/PostEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, excerpt, body, published")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Edit article</h1>
      <PostEditor authorId={user.id} initial={post} />
    </div>
  );
}
