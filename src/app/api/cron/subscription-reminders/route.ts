import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, sendSubscriptionExpiringSoonEmail, sendSubscriptionExpiredEmail } from "@/lib/email";

const REMINDER_DAYS_BEFORE = 3;

export async function runSubscriptionReminders(): Promise<{ remindersSent: number; expiredSent: number }> {
  const now = new Date();
  const reminderWindowEnd = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);
  const paymentLink = `${getAppBaseUrl()}/dashboard/pago`;

  // ── Aviso "caduca en N días" ──
  const expiringSoonUsers = await prisma.user.findMany({
    where: {
      role: "USER",
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: { gt: now, lte: reminderWindowEnd },
      subscriptionExpiryReminderSentAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionEndDate: true,
      gym: { select: { name: true } },
    },
  });

  let remindersSent = 0;
  for (const user of expiringSoonUsers) {
    try {
      const daysLeft = Math.max(1, Math.ceil((user.subscriptionEndDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      const endDateLabel = user.subscriptionEndDate!.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
      await sendSubscriptionExpiringSoonEmail(user.email, user.name, user.gym?.name || "tu gimnasio", daysLeft, endDateLabel, paymentLink);
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionExpiryReminderSentAt: now } });
      remindersSent++;
    } catch (e) {
      console.error(`Error sending expiry reminder to user ${user.id}:`, e);
    }
  }

  // ── Aviso "cuota caducada" (una sola vez, aunque el estado en BD siga "ACTIVE") ──
  const expiredUsers = await prisma.user.findMany({
    where: {
      role: "USER",
      subscriptionEndDate: { lt: now },
      subscriptionExpiredNotifiedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      gym: { select: { name: true } },
    },
  });

  let expiredSent = 0;
  for (const user of expiredUsers) {
    try {
      await sendSubscriptionExpiredEmail(user.email, user.name, user.gym?.name || "tu gimnasio", paymentLink);
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionExpiredNotifiedAt: now } });
      expiredSent++;
    } catch (e) {
      console.error(`Error sending expired notification to user ${user.id}:`, e);
    }
  }

  return { remindersSent, expiredSent };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isSecretValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { remindersSent, expiredSent } = await runSubscriptionReminders();

    return NextResponse.json({
      message: `CRON completado: ${remindersSent} avisos de caducidad próxima, ${expiredSent} avisos de cuota caducada`,
      remindersSent,
      expiredSent,
    });
  } catch (error) {
    console.error("CRON subscription-reminders error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
