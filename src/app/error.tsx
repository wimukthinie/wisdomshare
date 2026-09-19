"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3">The page could not be loaded. Try again, and if it keeps happening, log out and back in.</p>
      <button onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
