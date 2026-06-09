import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

// GET: Fetch all finished class bookings for which the user hasn't confirmed attendance yet
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const now = await getNow();

    // Find class bookings that have finished (endTime < now) and status is still CONFIRMED
    const pendingBookings = await prisma.classBooking.findMany({
      where: {
        userId: session.user.id,
        status: "CONFIRMED",
        class: {
          endTime: {
            lt: now,
          },
        },
      },
      include: {
        class: true,
      },
      orderBy: {
        class: {
          startTime: "asc",
        },
      },
    });

    const result = pendingBookings.map((b) => ({
      id: b.id,
      className: b.class.name,
      startTime: b.class.startTime.toISOString(),
      endTime: b.class.endTime.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pending class attendances:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Confirm or deny attendance to a finished class booking
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { bookingId, attended } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ message: "bookingId es requerido" }, { status: 400 });
    }

    // Find the booking and make sure it belongs to the user
    const booking = await prisma.classBooking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        class: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ message: "Esta asistencia ya ha sido registrada" }, { status: 400 });
    }

    if (attended) {
      // 1. Update ClassBooking status to ATTENDED
      await prisma.classBooking.update({
        where: { id: bookingId },
        data: { status: "ATTENDED" },
      });

      // 2. Create a completed WorkoutSession corresponding to the class duration
      await prisma.workoutSession.create({
        data: {
          userId: session.user.id,
          className: booking.class.name,
          startTime: booking.class.startTime,
          endTime: booking.class.endTime,
        },
      });
    } else {
      // User didn't attend the class: mark booking status as ABSENT
      await prisma.classBooking.update({
        where: { id: bookingId },
        data: { status: "ABSENT" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering class attendance:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
