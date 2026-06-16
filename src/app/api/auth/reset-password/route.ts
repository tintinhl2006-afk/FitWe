import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token de restablecimiento es requerido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // 1. Buscar usuario con token válido y vigente
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Vence después de la fecha/hora actual
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "El token de restablecimiento es inválido o ha expirado." },
        { status: 400 }
      );
    }

    // 2. Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // 3. Actualizar contraseña y limpiar campos de recuperación
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        // Si tuviera contraseña provisional, la damos por restablecida
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      message: "Tu contraseña ha sido restablecida con éxito.",
    });
  } catch (error) {
    console.error("Error in reset-password route:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
