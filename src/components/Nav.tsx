import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Main">
          <Link href="/" className="font-display text-xl font-bold">MentorHub</Link>
          <Link href="/mentors" className="text-sm hover:underline">Mentors</Link>
          <Link href="/blog" className="text-sm hover:underline">Blog</Link>
          <Link href="/about" className="text-sm hover:underline">About</Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              {role === "mentor" && <Link href="/blog/manage" className="btn btn-ghost">My articles</Link>}
              <Link href="/profile" className="btn btn-ghost">Profile</Link>
              <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <form action={signOut}>
                <button className="btn btn-ghost">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
