import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getRequestUserId } from "@/lib/apiAuth";
import { sendVerificationEmail, getAppBaseUrl } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Tu email ya está verificado." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationTokenExpiry: expiry },
    });

    const verifyLink = `${getAppBaseUrl(req)}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, user.name, verifyLink);

    return NextResponse.json({ message: "Te hemos enviado un nuevo email de verificación." });
  } catch (error) {
    console.error("Error in resend-verification route:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
