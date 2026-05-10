import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

const BOOKING_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

// GET: List upcoming classes for the user's gym
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Find user's gym
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gymId: true },
    });

    if (!user?.gymId) {
      return NextResponse.json({ message: "No perteneces a ningún gimnasio" }, { status: 400 });
    }

    const now = await getNow();

    const classes = await prisma.gymClass.findMany({
      where: {
        gymId: user.gymId,
        startTime: { gte: now }, // Only future classes
      },
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          where: { userId: session.user.id },
          select: { id: true, status: true },
        },
      },
      orderBy: { startTime: "asc" },
      take: 50,
    });

    const result = classes.map((c) => {
      const msUntilStart = c.startTime.getTime() - now.getTime();
      const isOpen = msUntilStart <= BOOKING_WINDOW_MS;
      const userBooking = c.bookings[0] || null;
      const isFull = c._count.bookings >= c.capacity;

      return {
        id: c.id,
        name: c.name,
        instructor: c.instructor,
        capacity: c.capacity,
        startTime: c.startTime.toISOString(),
        endTime: c.endTime.toISOString(),
        spotsLeft: c.capacity - c._count.bookings,
        isOpen,
        isFull,
        opensAt: isOpen ? null : new Date(c.startTime.getTime() - BOOKING_WINDOW_MS).toISOString(),
        userBookingId: userBooking?.id || null,
        isBooked: !!userBooking,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Book a class (with 48h server-side validation)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { classId } = await req.json();
    if (!classId) {
      return NextResponse.json({ message: "classId requerido" }, { status: 400 });
    }

    // Find user's gym and check subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        gymId: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user?.gymId) {
      return NextResponse.json({ message: "No perteneces a ningún gimnasio" }, { status: 400 });
    }

    // Subscription check (Backend barrier)
    const now = await getNow();
    const isExpired = user.subscriptionEndDate && user.subscriptionEndDate < now;
    if (user.subscriptionStatus === "INACTIVE" || isExpired) {
      return NextResponse.json({ 
        message: "Tu suscripción ha caducado. Por favor, contacta con tu gimnasio." 
      }, { status: 403 });
    }

    // Find the class
    const gymClass = await prisma.gymClass.findFirst({
      where: {
        id: classId,
        gymId: user.gymId, // IDOR: only classes from user's gym
      },
      include: { _count: { select: { bookings: true } } },
    });

    if (!gymClass) {
      return NextResponse.json({ message: "Clase no encontrada" }, { status: 404 });
    }

    // Server-side 48h validation (anti-bypass)
    const msUntilStart = gymClass.startTime.getTime() - now.getTime();
    if (msUntilStart > BOOKING_WINDOW_MS) {
      return NextResponse.json(
        { message: "Las reservas aún no están abiertas para esta clase" },
        { status: 403 }
      );
    }

    if (msUntilStart < 0) {
      return NextResponse.json({ message: "Esta clase ya ha comenzado" }, { status: 400 });
    }

    // Check capacity
    if (gymClass._count.bookings >= gymClass.capacity) {
      return NextResponse.json({ message: "Clase completa" }, { status: 409 });
    }

    // Check duplicate booking
    const existingBooking = await prisma.classBooking.findUnique({
      where: {
        userId_classId: { userId: session.user.id, classId },
      },
    });

    if (existingBooking) {
      return NextResponse.json({ message: "Ya tienes una reserva para esta clase" }, { status: 409 });
    }

    const booking = await prisma.classBooking.create({
      data: {
        userId: session.user.id,
        classId,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error booking class:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Cancel a booking
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ message: "bookingId requerido" }, { status: 400 });
    }

    const booking = await prisma.classBooking.findFirst({
      where: { id: bookingId, userId: session.user.id },
    });

    if (!booking) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 });
    }

    await prisma.classBooking.delete({ where: { id: bookingId } });

    return NextResponse.json({ message: "Reserva cancelada" });
  } catch (error) {
    console.error("Error canceling booking:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
