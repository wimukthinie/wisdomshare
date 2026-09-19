"use client";

import Link from "next/link";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { track } from "@/lib/analytics";

/**
 * A/B test for the landing hero. Create a multivariate feature flag called
 * "landing-hero" in PostHog with variants "control" and "test".
 * Visitors who have not consented to analytics always see the control version.
 */
export default function HeroExperiment() {
  const variant = useFeatureFlagVariantKey("landing-hero");
  const isTest = variant === "test";

  return (
    <div>
      <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
        {isTest ? "Book your first mentoring session this week." : "Learn from someone who has already done it."}
      </h1>
      <p className="mt-5 max-w-md text-lg">
        {isTest
          ? "Pick a mentor, agree on a goal and meet on video. Signing up takes under a minute."
          : "MentorHub matches early-career people with mentors for regular one-to-one sessions. Chat between calls, share documents and meet on video."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {isTest ? (
          <>
            <Link href="/signup" onClick={() => track("hero_cta_click", { cta: "signup", variant: "test" })} className="btn btn-primary">Create a free account</Link>
            <Link href="/mentors" onClick={() => track("hero_cta_click", { cta: "browse", variant: "test" })} className="btn btn-ghost">Browse mentors</Link>
          </>
        ) : (
          <>
            <Link href="/mentors" onClick={() => track("hero_cta_click", { cta: "browse", variant: "control" })} className="btn btn-primary">Browse mentors</Link>
            <Link href="/signup" onClick={() => track("hero_cta_click", { cta: "signup", variant: "control" })} className="btn btn-ghost">Create an account</Link>
          </>
        )}
      </div>
    </div>
  );
}
