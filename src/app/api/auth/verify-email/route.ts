import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "El token de verificación es requerido."),
});

export async function POST(req: Request) {
  try {
    const { allowed } = await checkRateLimit(`verify-email:ip:${getClientIp(req)}`, 20, 15);
    if (!allowed) {
      return NextResponse.json(
        { message: "Demasiados intentos. Inténtalo de nuevo más tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { token } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "El enlace de verificación es inválido o ha expirado." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: "Tu email ha sido verificado con éxito." });
  } catch (error) {
    console.error("Error in verify-email route:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
