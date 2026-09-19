import Link from "next/link";

export const metadata = { title: "About" };

const faqs = [
  { q: "Is MentorHub free?", a: "Yes. During the research pilot all features are free for mentors and mentees." },
  { q: "Who can read my messages?", a: "Only you and the person you are matched with. Files are stored privately and shared through short-lived links." },
  { q: "How do I become a mentor?", a: "Sign up and choose Mentor, then complete your profile so mentees can find you." },
  { q: "Can I end a mentorship?", a: "Yes. Tell your mentor or mentee in the chat. Automatic ending is planned for a later version." },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">About MentorHub</h1>
      <div className="article mt-4 text-lg">
        <p>
          MentorHub connects people who are starting out with people who have been there. Mentees
          find a mentor, agree on goals, and meet regularly on video, with a private chat and shared
          documents in between.
        </p>
        <p>
          The platform is also a university research project on how interface design affects
          sign-ups and engagement. When you agree to analytics, we compare design versions and
          measure things like how many visitors create an account. We do not record what you write
          in chats. See the <Link href="/privacy">privacy page</Link> for details.
        </p>
        <h2>For mentees</h2>
        <p>Browse mentors, send a request, and once accepted set goals and book sessions.</p>
        <h2>For mentors</h2>
        <p>Share your experience one-to-one and publish articles on the blog for everyone.</p>
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold">Common questions</h2>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="py-3">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
