"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Initial = { id: string; title: string; excerpt: string | null; body: string; published: boolean };

function slugify(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "article"}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PostEditor({ authorId, initial }: { authorId: string; initial?: Initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const fields = {
      title: String(form.get("title")).trim(),
      excerpt: String(form.get("excerpt")).trim() || null,
      body: String(form.get("body")),
      published: form.get("published") === "on",
    };

    const supabase = createClient();
    const { error } = initial
      ? await supabase.from("posts").update(fields).eq("id", initial.id)
      : await supabase.from("posts").insert({ ...fields, slug: slugify(fields.title), author_id: authorId });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push("/blog/manage");
    router.refresh();
  }

  async function remove() {
    if (!initial || !confirm("Delete this article? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", initial.id);
    if (error) return setError(error.message);
    router.push("/blog/manage");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold">Title</label>
        <input id="title" name="title" required maxLength={150} defaultValue={initial?.title} className="field" />
      </div>
      <div>
        <label htmlFor="excerpt" className="mb-1 block text-sm font-semibold">Short summary</label>
        <textarea id="excerpt" name="excerpt" rows={2} maxLength={300} defaultValue={initial?.excerpt ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-semibold">Article</label>
        <textarea id="body" name="body" required rows={16} defaultValue={initial?.body} className="field font-mono text-sm" />
        <p className="mt-1 text-sm text-ink/70">Formatting: ## Heading, - list item, **bold**, [link text](https://example.com)</p>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={initial?.published} />
        Publish this article (visible to everyone)
      </label>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button disabled={saving} className="btn btn-primary">{saving ? "Saving" : "Save article"}</button>
        {initial && <button type="button" onClick={remove} className="btn btn-ghost">Delete</button>}
      </div>
    </form>
  );
}
