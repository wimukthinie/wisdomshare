import posthog from "posthog-js";

/** Sends an event to PostHog only if analytics is configured and the visitor consented. */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !posthog.__loaded) return;
  posthog.capture(event, props);
}
