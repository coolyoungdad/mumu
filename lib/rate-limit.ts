/**
 * Rate limiting for financial API endpoints.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured.
 * Falls back to passthrough (no limiting) in local development.
 *
 * Setup:
 * 1. Create a free Redis database at upstash.com
 * 2. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 * 3. npm install @upstash/ratelimit @upstash/redis
 */

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// Passthrough limiter for when Upstash isn't configured
const passthrough = async (): Promise<LimitResult> => ({
  success: true,
  limit: 999,
  remaining: 999,
  reset: Date.now() + 60_000,
});

async function createLimiter(windowSeconds: number, maxRequests: number) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Return a passthrough function when Upstash isn't configured
    return { limit: async (_key: string) => passthrough() };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error — optional peer dep, not installed until Upstash is configured
    const { Ratelimit } = await import("@upstash/ratelimit");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error — optional peer dep, not installed until Upstash is configured
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: false,
    });
  } catch {
    // If packages aren't installed, passthrough
    return { limit: async (_key: string) => passthrough() };
  }
}

// Box open: 10 per minute per user (generous enough for normal use, blocks scripts)
let _boxLimiter: Awaited<ReturnType<typeof createLimiter>> | null = null;
export async function checkBoxOpenLimit(userId: string): Promise<LimitResult> {
  if (!_boxLimiter) _boxLimiter = await createLimiter(60, 10);
  return _boxLimiter.limit(`box:${userId}`);
}

// Top-up: 5 per minute per user
let _topupLimiter: Awaited<ReturnType<typeof createLimiter>> | null = null;
export async function checkTopupLimit(userId: string): Promise<LimitResult> {
  if (!_topupLimiter) _topupLimiter = await createLimiter(60, 5);
  return _topupLimiter.limit(`topup:${userId}`);
}
