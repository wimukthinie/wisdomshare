import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-3">The page may have moved, or you may not have access to it.</p>
      <Link href="/" className="btn btn-primary mt-6">Go to the home page</Link>
    </div>
  );
}
