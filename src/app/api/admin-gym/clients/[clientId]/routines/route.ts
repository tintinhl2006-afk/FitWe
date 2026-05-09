import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    if (session.user.role !== "GYM") return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });

    const { clientId } = await params;

    // IDOR: verify client belongs to this gym
    const client = await prisma.user.findFirst({
      where: { id: clientId, gymId: session.user.id, role: "USER" },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });

    const routines = await prisma.routine.findMany({
      where: { userId: clientId },
      orderBy: { createdAt: "desc" },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error("Error fetching client routines:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    if (session.user.role !== "GYM") return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });

    const { clientId } = await params;

    // IDOR: verify client belongs to this gym
    const client = await prisma.user.findFirst({
      where: { id: clientId, gymId: session.user.id, role: "USER" },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: "El nombre de la rutina es obligatorio" }, { status: 400 });
    }

    // Create the routine assigned to the CLIENT (not the gym)
    const routine = await prisma.routine.create({
      data: {
        name,
        userId: clientId,
      },
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error("Error creating client routine:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
