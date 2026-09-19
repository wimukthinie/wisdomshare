"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useEffect, useSyncExternalStore } from "react";

const CONSENT_KEY = "analytics-consent";
const CONSENT_EVENT = "consent-change";

function readConsent(): string {
  try {
    return localStorage.getItem(CONSENT_KEY) ?? "unset";
  } catch {
    return "denied"; // storage blocked: do not track
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // "pending" on the server so the banner never flashes during hydration.
  const consent = useSyncExternalStore(subscribe, readConsent, () => "pending");
  const ask = Boolean(key) && consent === "unset";

  useEffect(() => {
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: "history_change",
      person_profiles: "identified_only",
      opt_out_capturing_by_default: true, // nothing is recorded until the visitor agrees
    });
    if (readConsent() === "granted") posthog.opt_in_capturing();
  }, [key]);

  function choose(granted: boolean) {
    try { localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied"); } catch { /* ignore */ }
    if (granted) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  return (
    <Provider client={posthog}>
      {children}
      {ask && (
        <div role="dialog" aria-label="Analytics consent" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm">
              This site is part of a university research project. With your permission we record
              which pages you visit and which buttons you use, to study how design changes affect
              sign-ups. We never record message content.{" "}
              <Link href="/privacy" className="font-semibold underline">Read more</Link>
            </p>
            <div className="flex gap-2">
              <button onClick={() => choose(false)} className="btn btn-ghost">Decline</button>
              <button onClick={() => choose(true)} className="btn btn-primary">Accept</button>
            </div>
          </div>
        </div>
      )}
    </Provider>
  );
}
