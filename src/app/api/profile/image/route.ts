import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { image } = body; // Base64 string

    if (!image) {
      return NextResponse.json({ message: "No se proporcionó imagen" }, { status: 400 });
    }

    // Validar el tamaño del base64 (límite aprox 2MB = ~2.6MB en base64)
    // 1 char base64 = 1 byte
    if (image.length > 2.8 * 1024 * 1024) {
      return NextResponse.json({ message: "La imagen es demasiado grande (máximo 2MB)" }, { status: 413 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
      select: { image: true },
    });

    return NextResponse.json({ message: "Imagen actualizada correctamente", image: updatedUser.image });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
