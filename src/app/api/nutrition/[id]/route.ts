import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la comida pertenece al usuario antes de borrar
    const foodEntry = await prisma.foodEntry.findUnique({
      where: { id },
    });

    if (!foodEntry || foodEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Alimento no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    await prisma.foodEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Alimento eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting food entry:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
