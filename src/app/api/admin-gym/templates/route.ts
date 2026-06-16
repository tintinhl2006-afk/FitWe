import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassesFromTemplate } from "@/lib/classUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || (session.user.role !== "GYM" && session.user.role !== "EMPLOYEE")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.role === "GYM" ? session.user.id : session.user.gymId;
    if (!gymId) {
      return NextResponse.json({ message: "Gimnasio no asociado" }, { status: 400 });
    }

    const templates = await prisma.classTemplate.findMany({
      where: { gymId },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || (session.user.role !== "GYM" && session.user.role !== "EMPLOYEE")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.role === "GYM" ? session.user.id : session.user.gymId;
    if (!gymId) {
      return NextResponse.json({ message: "Gimnasio no asociado" }, { status: 400 });
    }

    const body = await req.json();
    const { name, instructor, instructorId, capacity, dayOfWeek, startTime, durationMinutes } = body;

    let finalInstructor = instructor;
    let finalInstructorId = instructorId;

    if (session.user.role === "EMPLOYEE") {
      finalInstructor = session.user.name;
      finalInstructorId = session.user.id;
    }

    const template = await prisma.classTemplate.create({
      data: {
        name,
        instructor: finalInstructor,
        instructorId: finalInstructorId || null,
        capacity: parseInt(capacity),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        durationMinutes: parseInt(durationMinutes),
        gymId,
      },
    });

    // Eager Generation: Generate classes for the next 7 days immediately
    await generateClassesFromTemplate(template, 7);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== "GYM" && session.user.role !== "EMPLOYEE")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.role === "GYM" ? session.user.id : session.user.gymId;
    if (!gymId) {
      return NextResponse.json({ message: "Gimnasio no asociado" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "ID requerido" }, { status: 400 });

    const template = await prisma.classTemplate.findFirst({
      where: { id, gymId }
    });

    if (!template) {
      return NextResponse.json({ message: "Plantilla no encontrada" }, { status: 404 });
    }

    if (session.user.role === "EMPLOYEE" && template.instructorId !== session.user.id) {
      return NextResponse.json({ message: "No autorizado para eliminar esta plantilla" }, { status: 403 });
    }

    await prisma.classTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
