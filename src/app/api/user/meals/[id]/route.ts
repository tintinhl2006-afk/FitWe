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

    const meal = await prisma.mealEntry.findUnique({
      where: { id },
    });

    if (!meal || meal.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Registro no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    await prisma.mealEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal entry:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
