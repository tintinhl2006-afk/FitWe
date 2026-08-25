import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(gym);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "GYM") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { occupancyTrackingEnabled, occupancyAutoExitMinutes } = body;

  const updateData: Record<string, any> = {};

  if (occupancyTrackingEnabled !== undefined) {
    updateData.occupancyTrackingEnabled = Boolean(occupancyTrackingEnabled);
  }

  if (occupancyAutoExitMinutes !== undefined) {
    const minutes = Number(occupancyAutoExitMinutes);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 1440) {
      return NextResponse.json(
        { message: "El temporizador debe estar entre 5 y 1440 minutos" },
        { status: 400 }
      );
    }
    updateData.occupancyAutoExitMinutes = Math.round(minutes);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { occupancyTrackingEnabled: true, occupancyAutoExitMinutes: true },
  });

  return NextResponse.json(updated);
}
