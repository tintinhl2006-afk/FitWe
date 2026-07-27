import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { getRequestUserId } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const serverNow = await getNow();

    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
      serverNow: serverNow.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user subscription status:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
