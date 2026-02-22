/**
 * Analytics wrapper for MuMu.
 *
 * Uses PostHog when NEXT_PUBLIC_POSTHOG_KEY is configured.
 * Falls back to console logging in local development.
 *
 * Setup:
 * 1. Sign up at posthog.com → Create project → Next.js
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_POSTHOG_KEY=phc_...
 *    NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
 * 3. npm install posthog-js
 *
 * Key shake metrics to watch in PostHog after launch:
 * - shake_adoption_rate: shake_charged / box_opened_no_shake
 * - post_shake_conversion: box_opened_after_shake / shake_charged
 * - fresh_box_rate: fresh_box_requested / shake_charged
 * - abandonment: sessions with shake_charged but no box open event
 */

// All tracked events and their properties
export type AnalyticsEvent =
  | { event: "shake_initiated" }
  | { event: "shake_charged"; properties: { eliminated_count: number; new_balance: number } }
  | { event: "shake_abandoned" }
  | { event: "fresh_box_requested" }
  | { event: "box_opened_after_shake"; properties: { rarity: string; product_name: string; new_balance: number } }
  | { event: "box_opened_no_shake"; properties: { rarity: string; product_name: string; new_balance: number } }
  | { event: "item_sold_back"; properties: { rarity: string; buyback_price: number } }
  | { event: "item_kept"; properties: { rarity: string } }
  | { event: "topup_started"; properties: { amount: number } }
  | { event: "topup_completed"; properties: { amount: number } }
  | { event: "user_signed_up" };

// Client-side track function — call from React components
export function track(e: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey) {
    // Local dev: log to console so you can verify events fire
    console.log("[Analytics]", e.event, "properties" in e ? e.properties : "");
    return;
  }

  // PostHog is initialized by PostHogProvider in layout.tsx
  // Access via window.posthog if available
  const ph = (window as typeof window & { posthog?: { capture: (event: string, props?: object) => void } }).posthog;
  if (ph) {
    ph.capture(e.event, "properties" in e ? e.properties : undefined);
  }
}
