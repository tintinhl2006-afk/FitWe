import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentOccupancy } from "@/lib/occupancyUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "GYM") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const gym = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { occupancyTrackingEnabled: true, occupancyAutoExitMinutes: true },
  });

  if (!gym) {
    return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
  }

  if (!gym.occupancyTrackingEnabled) {
    return NextResponse.json({ enabled: false });
  }

  const count = await getCurrentOccupancy(session.user.id, gym.occupancyAutoExitMinutes);

  return NextResponse.json({
    enabled: true,
    count,
    autoExitMinutes: gym.occupancyAutoExitMinutes,
  });
}
