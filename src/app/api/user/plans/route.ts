import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET available plans for the current user's gym
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Get user's gymId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gymId: true, planId: true },
    });

    if (!user?.gymId) {
      return NextResponse.json({ message: "No estás vinculado a ningún gimnasio" }, { status: 400 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        gymId: user.gymId,
        isActive: true,
      },
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      plans,
      currentPlanId: user.planId,
    });
  } catch (error) {
    console.error("Error fetching gym plans:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
