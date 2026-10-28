import crypto from "crypto";

/**
 * Constant-time check of the cron shared secret. Fails closed when CRON_SECRET is unset, so a
 * missing variable disables the cron routes instead of opening them.
 */
export function isValidCronRequest(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const presented = Buffer.from(req.headers.get("authorization") ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${cronSecret}`, "utf8");
  if (presented.length !== expected.length) return false;
  return crypto.timingSafeEqual(presented, expected);
}
