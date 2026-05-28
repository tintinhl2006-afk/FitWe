import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { generateClassesFromTemplate } from "@/lib/classUtils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const now = await getNow();
    
    // Auto-generar clases basadas en plantillas para el gimnasio para los próximos 14 días.
    // Esto garantiza consistencia local de forma automática sin depender exclusivamente de un cron externo.
    const templates = await prisma.classTemplate.findMany({
      where: { gymId: session.user.id },
    });
    for (const template of templates) {
      await generateClassesFromTemplate(template, 14);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-05-22"
    
    let dateFilter = {};
    if (dateParam) {
      const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);
      dateFilter = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    } else {
      // We fetch classes from 1 month ago to 2 months into the future relative to mocked 'now'
      // to ensure the calendar view has enough data.
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 2);
      
      dateFilter = {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const classes = await prisma.gymClass.findMany({
      where: { 
        gymId: session.user.id,
        ...dateFilter
      },
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching gym classes:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

// DELETE: Cancel/remove a specific class instance
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("id");

    if (!classId) {
      return NextResponse.json({ message: "ID requerido" }, { status: 400 });
    }

    const gymClass = await prisma.gymClass.findFirst({
      where: { id: classId, gymId: session.user.id },
    });

    if (!gymClass) {
      return NextResponse.json({ message: "Clase no encontrada" }, { status: 404 });
    }

    // Delete bookings first, then the class
    await prisma.$transaction([
      prisma.classBooking.deleteMany({ where: { classId } }),
      prisma.gymClass.delete({ where: { id: classId } }),
    ]);

    return NextResponse.json({ message: "Clase cancelada correctamente" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
