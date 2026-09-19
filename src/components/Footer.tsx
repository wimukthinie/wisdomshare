import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm">
        <p>MentorHub is a university research project.</p>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
