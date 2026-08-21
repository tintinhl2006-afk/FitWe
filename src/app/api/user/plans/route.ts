import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET available plans for the current user's gym
export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      console.warn("[API PLANS GET] Unauthorized access attempt");
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Get user's gymId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gymId: true,
        planId: true,
        creditsRemaining: true,
        plan: { select: { billingType: true } },
      },
    });
    console.log("[API PLANS GET] DB User:", user);

    if (!user?.gymId) {
      console.warn(`[API PLANS GET] User ${userId} has no gymId`);
      return NextResponse.json({ message: "No estás vinculado a ningún gimnasio" }, { status: 400 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        gymId: user.gymId,
        isActive: true,
      },
      orderBy: { price: "asc" },
    });
    console.log(`[API PLANS GET] Found ${plans.length} active plans for gym ${user.gymId}`);

    // Get the gym's active payment method (only one can be active at a time)
    const activeMethod = await prisma.gymPaymentMethod.findFirst({
      where: { gymId: user.gymId, isActive: true },
    });

    const isMethodUsable =
      !!activeMethod &&
      (activeMethod.gateway === "STRIPE"
        ? !!activeMethod.stripeConnected && !!activeMethod.stripeAccountId
        : !!activeMethod.redsysFuc && !!activeMethod.redsysClave);

    const paymentGateway = isMethodUsable ? (activeMethod!.gateway === "STRIPE" ? "stripe" : "redsys") : null;

    return NextResponse.json({
      plans,
      currentPlanId: user.planId,
      paymentGateway,
      billingType: user.plan?.billingType ?? null,
      creditsRemaining: user.creditsRemaining,
    });
  } catch (error: any) {
    console.error("Error fetching gym plans:", error);
    return NextResponse.json({
      error: "Error interno",
      message: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}
