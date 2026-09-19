import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import LocalTime from "@/components/LocalTime";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("title, excerpt").eq("slug", slug).eq("published", true).maybeSingle();
  return { title: data?.title ?? "Article", description: data?.excerpt ?? undefined };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("title, body, created_at, author_id, author:profiles(full_name)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) notFound();
  const post = data as unknown as {
    title: string; body: string; created_at: string; author_id: string | null;
    author: { full_name: string | null } | null;
  };

  return (
    <article className="max-w-2xl">
      <Link href="/blog" className="text-sm underline">All articles</Link>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="mt-2 text-sm text-ink/70">
        {post.author?.full_name && post.author_id ? (
          <>By <Link href={`/mentors/${post.author_id}`} className="underline">{post.author.full_name}</Link>, </>
        ) : null}
        <LocalTime iso={post.created_at} />
      </p>
      <div className="article mt-8 text-lg leading-relaxed">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </article>
  );
}
