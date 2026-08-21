import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Auth Check: Only Bearer Secret (CRON)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isSecretValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const now = new Date();

    // Clientes con una tarifa de bono en modo "recarga automática" cuyo próximo reseteo ya tocaba
    const dueUsers = await prisma.user.findMany({
      where: {
        creditsNextRechargeAt: { lte: now },
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: { gte: now },
        plan: { billingType: "CREDITS", creditRechargeMode: "PERIODIC" },
      },
      select: {
        id: true,
        creditsNextRechargeAt: true,
        plan: { select: { creditsPerCycle: true, rechargeIntervalDays: true } },
      },
    });

    let recharged = 0;

    for (const user of dueUsers) {
      if (!user.plan?.rechargeIntervalDays) continue;

      // Avanzar desde la fecha programada anterior (no desde "ahora") para no acumular
      // desfase si el cron tarda en ejecutarse o se saltó algún ciclo.
      let nextRecharge = new Date(user.creditsNextRechargeAt!);
      while (nextRecharge <= now) {
        nextRecharge = new Date(nextRecharge.getTime() + user.plan.rechargeIntervalDays * 24 * 60 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditsRemaining: user.plan.creditsPerCycle ?? 0,
          creditsNextRechargeAt: nextRecharge,
        },
      });
      recharged++;
    }

    return NextResponse.json({
      message: `CRON completado: ${recharged} bonos recargados`,
      recharged,
    });
  } catch (error) {
    console.error("CRON recharge-credits error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
