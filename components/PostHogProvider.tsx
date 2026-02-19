"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// PostHog provider — initializes PostHog once on mount, tracks pageviews on route change.
// Only active when NEXT_PUBLIC_POSTHOG_KEY is set.
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!key) return;

    // Dynamically import posthog-js so it's only loaded when configured
    import("posthog-js").then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(key, {
          api_host: host,
          capture_pageview: false, // We handle pageviews manually below
          autocapture: false,      // Keep control over what's tracked
          persistence: "localStorage",
        });
      }
      posthog.capture("$pageview", { $current_url: window.location.href });

      // Expose on window so lib/analytics.ts track() can reach it
      (window as typeof window & { posthog: typeof posthog }).posthog = posthog;
    }).catch(() => {
      // posthog-js not installed — silently skip
    });
  }, [pathname]);

  return <>{children}</>;
}
