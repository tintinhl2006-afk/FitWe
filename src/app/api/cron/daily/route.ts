import { NextResponse } from "next/server";
import { runGenerateClasses } from "@/app/api/cron/generate-classes/route";
import { runRechargeCredits } from "@/app/api/cron/recharge-credits/route";
import { runClassReminders } from "@/app/api/cron/class-reminders/route";
import { runSubscriptionReminders } from "@/app/api/cron/subscription-reminders/route";
import { cleanupOldRateLimitHits } from "@/lib/rateLimit";

/**
 * Single consolidated cron entry point, scheduled once daily via vercel.json.
 *
 * Vercel's Hobby plan caps both how many cron jobs a project can have and how often each can
 * run (at most once/day) — nowhere near enough for 4 separate schedules. Rather than needing a
 * paid plan or an external scheduler just to run 4 small jobs, this route runs all 4 job
 * bodies in one invocation (each one is still independently callable at its own URL, with its
 * own CRON_SECRET check, for manual testing/debugging).
 *
 * Each job's failure is caught independently so one broken job (e.g. an email provider outage)
 * never prevents the others from running.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isSecretValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const results: Record<string, any> = {};

    try {
      results.generateClasses = await runGenerateClasses();
    } catch (e) {
      console.error("CRON daily: generate-classes failed:", e);
      results.generateClasses = { error: String(e) };
    }

    try {
      results.rechargeCredits = await runRechargeCredits();
    } catch (e) {
      console.error("CRON daily: recharge-credits failed:", e);
      results.rechargeCredits = { error: String(e) };
    }

    try {
      results.classReminders = await runClassReminders();
    } catch (e) {
      console.error("CRON daily: class-reminders failed:", e);
      results.classReminders = { error: String(e) };
    }

    try {
      results.subscriptionReminders = await runSubscriptionReminders();
    } catch (e) {
      console.error("CRON daily: subscription-reminders failed:", e);
      results.subscriptionReminders = { error: String(e) };
    }

    try {
      results.rateLimitCleanup = { deleted: await cleanupOldRateLimitHits() };
    } catch (e) {
      console.error("CRON daily: rate-limit cleanup failed:", e);
      results.rateLimitCleanup = { error: String(e) };
    }

    return NextResponse.json({ message: "CRON diario completado", results });
  } catch (error) {
    console.error("CRON daily error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
