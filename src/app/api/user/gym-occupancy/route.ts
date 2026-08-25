import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";
import { getCurrentOccupancy } from "@/lib/occupancyUtils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gymId: true },
    });

    if (!user?.gymId) {
      return NextResponse.json({ enabled: false });
    }

    const gym = await prisma.user.findUnique({
      where: { id: user.gymId },
      select: { occupancyTrackingEnabled: true, occupancyAutoExitMinutes: true },
    });

    if (!gym?.occupancyTrackingEnabled) {
      return NextResponse.json({ enabled: false });
    }

    const count = await getCurrentOccupancy(user.gymId, gym.occupancyAutoExitMinutes);

    return NextResponse.json({ enabled: true, count });
  } catch (error) {
    console.error("Error fetching gym occupancy:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
