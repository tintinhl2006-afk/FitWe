import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { name, description, instructor, instructorId, capacity, date, startTime, endTime } = body;

    let finalInstructor = instructor;
    let finalInstructorId = instructorId;

    if (session.user.role === "EMPLOYEE") {
      finalInstructor = session.user.name;
      finalInstructorId = session.user.id;
    }

    if (!name || !finalInstructor || !capacity || !date || !startTime || !endTime) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ message: "Formato de fecha u hora inválido" }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({ message: "La hora de inicio debe ser anterior a la de fin" }, { status: 400 });
    }

    const newClass = await prisma.gymClass.create({
      data: {
        name,
        description,
        instructor: finalInstructor,
        instructorId: finalInstructorId || null,
        capacity: parseInt(capacity),
        startTime: start,
        endTime: end,
        gymId,
        // templateId remains null for one-off events
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating single class:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
