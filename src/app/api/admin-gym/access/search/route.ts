import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Buscar clientes asociados a este gimnasio cuyo nombre coincida parcialmente
    const clients = await prisma.user.findMany({
      where: {
        gymId: session.user.id,
        name: {
          contains: query.trim(),
          mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 8, // Limitar a 8 sugerencias rápidas
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error searching clients for access control:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
