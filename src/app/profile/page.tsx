import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, headline, bio, skills")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Your profile</h1>
      <p className="mt-2 mb-8">
        You are signed in as a <strong>{profile?.role ?? "mentee"}</strong>.
        {profile?.role === "mentor" && (
          <> Mentees see this page on your <Link href={`/mentors/${user.id}`} className="underline">public profile</Link>.</>
        )}
      </p>
      <ProfileForm
        userId={user.id}
        role={profile?.role ?? "mentee"}
        initial={{
          full_name: profile?.full_name ?? null,
          headline: profile?.headline ?? null,
          bio: profile?.bio ?? null,
          skills: profile?.skills ?? null,
        }}
      />
    </div>
  );
}
