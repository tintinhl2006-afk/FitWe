import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET available plans for the current user's gym
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("[API PLANS GET] Session user:", session?.user);
    if (!session?.user?.id) {
      console.warn("[API PLANS GET] Unauthorized access attempt");
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Get user's gymId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gymId: true, planId: true },
    });
    console.log("[API PLANS GET] DB User:", user);

    if (!user?.gymId) {
      console.warn(`[API PLANS GET] User ${session.user.id} has no gymId`);
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

    // Get gym's active payment gateways
    const gym = await prisma.user.findUnique({
      where: { id: user.gymId },
      select: {
        stripeAccountId: true,
        stripeConnected: true,
        stripeEnabled: true,
        redsysEnabled: true,
        redsysFuc: true,
        redsysClave: true,
      },
    });

    const hasStripe = 
      !!gym?.stripeEnabled && !!gym?.stripeConnected && !!gym?.stripeAccountId;
      
    const hasRedsys = 
      !!gym?.redsysEnabled && 
      !!gym?.redsysFuc && 
      !!gym?.redsysClave;

    return NextResponse.json({
      plans,
      currentPlanId: user.planId,
      hasStripe,
      hasRedsys,
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
