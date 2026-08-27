import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";
import { sendPasswordResetEmail, getAppBaseUrl } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Buscar usuario en base de datos
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Medida de seguridad (Email Enumeration Mitigation):
    // Si el usuario no existe, devolvemos 200 de todas formas para no dar pistas al atacante.
    if (!user) {
      return NextResponse.json({
        message: "Si tu cuenta de correo está registrada, recibirás un enlace de restablecimiento.",
      });
    }

    // 2. Generar token aleatorio seguro y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

    // Guardar en base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // 3. Generar enlace de restablecimiento (siempre en la web, incluso si la solicitud
    // viene de la app móvil — el reset en sí se hace en el navegador).
    const resetLink = `${getAppBaseUrl(req)}/reset-password?token=${token}`;

    // 4. Enviar email (vía Resend o loguear en consola si no hay clave de API)
    await sendPasswordResetEmail(trimmedEmail, user.name, resetLink);

    return NextResponse.json({
      message: "Si tu cuenta de correo está registrada, recibirás un enlace de restablecimiento.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
