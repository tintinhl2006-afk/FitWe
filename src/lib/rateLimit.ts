import { prisma } from "@/lib/prisma";

/**
 * Best-effort client IP from standard proxy headers (Vercel sets `x-forwarded-for`). Falls
 * back to a constant when unavailable (local dev without a proxy in front) — in that case
 * IP-based limiting effectively becomes "one global bucket," which is fine for dev and never
 * hit in production since Vercel always sets this header.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * DB-backed sliding-window rate limit — correct across the many concurrent, stateless
 * serverless function instances this app runs as (an in-memory counter would only ever see
 * requests routed to that one instance). Records this attempt and reports whether the caller
 * is still within `maxAttempts` over the last `windowMinutes`.
 *
 * Deliberately record-then-count (not count-then-record): under concurrent requests this can
 * let a request or two past the exact limit, which is the safe direction to be imprecise in
 * for a rate limiter (never block legitimate traffic due to a race, at the cost of the limit
 * being "at least N" rather than "at most N" under heavy concurrency).
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const [count] = await Promise.all([
    prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } }),
    prisma.rateLimitHit.create({ data: { key } }),
  ]);

  return { allowed: count < maxAttempts };
}

/** Deletes rate-limit rows old enough that no active window could still reference them. */
export async function cleanupOldRateLimitHits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
