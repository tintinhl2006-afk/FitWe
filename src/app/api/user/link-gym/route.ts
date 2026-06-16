import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const linkGymSchema = z.object({
  gymCode: z.string().length(6, "El código de gimnasio debe tener exactamente 6 caracteres."),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "USER") {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        gym: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      gymName: client?.gym?.name || null,
      gymLocation: client?.gym?.location || null,
    });
  } catch (error: any) {
    logger.error(`Error in link-gym GET route: ${error.message || error}`);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "USER") {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = linkGymSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { gymCode } = parsed.data;

    // Find gym
    const gym = await prisma.user.findFirst({
      where: {
        gymCode: gymCode.trim().toUpperCase(),
        role: "GYM",
      },
    });

    if (!gym) {
      return NextResponse.json(
        { message: "El código de gimnasio ingresado no es válido o no pertenece a ningún centro activo." },
        { status: 400 }
      );
    }

    // Get current client state
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, gymId: true, name: true },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // If already linked to this gym, return early
    if (client.gymId === gym.id) {
      return NextResponse.json(
        { message: "Ya estás vinculado a este centro deportivo." },
        { status: 200 }
      );
    }

    const oldGymId = client.gymId;

    // Atomic transaction to update gym link and clear subscription details
    await prisma.$transaction(async (tx) => {
      // Clear class bookings for the old gym to prevent cross-gym bookings issues
      await tx.classBooking.deleteMany({
        where: {
          userId: client.id,
        },
      });

      // Update client to new gym and deactivate subscription
      await tx.user.update({
        where: { id: client.id },
        data: {
          gymId: gym.id,
          subscriptionStatus: "INACTIVE",
          subscriptionEndDate: null,
          planId: null,
        },
      });
    });

    logger.info(`Cliente ${client.id} (${client.name}) transferido del gimnasio ${oldGymId} al gimnasio ${gym.id} (${gym.name})`);

    return NextResponse.json({
      message: `Te has vinculado correctamente al gimnasio "${gym.name}". Tu suscripción anterior ha sido desactivada.`,
    });
  } catch (error: any) {
    logger.error(`Error in link-gym route: ${error.message || error}`);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
