export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="article max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <p>
        This page is a template. Replace the text in square brackets with your own details and have
        your university ethics board review it before you recruit participants.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Account details: name, email address, role, and the profile text you write.</li>
        <li>Mentorship data: messages, shared files, goals, session bookings, notes and reviews. Only the people in a mentorship can read its private data. Reviews are public on the mentor&apos;s profile.</li>
      </ul>

      <h2>Analytics (only with your consent)</h2>
      <p>
        If you accept, we record page views and actions such as signing up, requesting a mentor and
        booking a session. We use this to compare design versions in a research study. We never
        record message content or file contents. If you decline, nothing is recorded and you see the
        standard design.
      </p>

      <h2>Research use</h2>
      <p>Results are reported in aggregate in [your dissertation title] at [your university]. No individual is identified.</p>

      <h2>Your choices</h2>
      <p>
        You can ask for your data to be deleted at any time by contacting [your email address].
        You can change your analytics choice by clearing this site&apos;s data in your browser and
        answering the banner again.
      </p>
    </div>
  );
}
