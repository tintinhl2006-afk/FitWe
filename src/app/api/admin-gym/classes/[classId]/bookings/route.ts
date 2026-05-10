import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch all bookings for a specific class
export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { classId } = await params;

    // Verify the class belongs to the GYM
    const gymClass = await prisma.gymClass.findUnique({
      where: { id: classId },
    });

    if (!gymClass || gymClass.gymId !== session.user.id) {
      return NextResponse.json({ message: "Clase no encontrada o no autorizada" }, { status: 404 });
    }

    // Fetch bookings with user data
    const bookings = await prisma.classBooking.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching class bookings:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel a specific booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");
    
    if (!bookingId) {
       return NextResponse.json({ message: "Booking ID requerido" }, { status: 400 });
    }

    const { classId } = await params;

    // Verify the class belongs to the GYM
    const gymClass = await prisma.gymClass.findUnique({
      where: { id: classId },
    });

    if (!gymClass || gymClass.gymId !== session.user.id) {
      return NextResponse.json({ message: "Clase no encontrada o no autorizada" }, { status: 404 });
    }

    // Delete the booking
    await prisma.classBooking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({ message: "Reserva cancelada correctamente" });
  } catch (error: any) {
    console.error("Error deleting class booking:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
