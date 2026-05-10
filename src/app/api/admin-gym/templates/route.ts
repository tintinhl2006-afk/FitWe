import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassesFromTemplate } from "@/lib/classUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const templates = await prisma.classTemplate.findMany({
      where: { gymId: session.user.id },
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

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, instructor, capacity, dayOfWeek, startTime, durationMinutes } = body;

    const template = await prisma.classTemplate.create({
      data: {
        name,
        instructor,
        capacity: parseInt(capacity),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        durationMinutes: parseInt(durationMinutes),
        gymId: session.user.id,
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
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "ID requerido" }, { status: 400 });

    await prisma.classTemplate.delete({
      where: { id, gymId: session.user.id }
    });

    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
