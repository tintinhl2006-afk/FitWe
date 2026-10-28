import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hashPassword } from "@/lib/password";
import { getRequestUserId, reissueBearerToken } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // The current password is verified here, which makes this endpoint a password-guessing
    // oracle for anyone holding a session. It had no limit at all.
    const limit = await checkRateLimit(`pwchange:user:${userId}`, 5, 15);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." },
        { status: 429 }
      );
    }

    const { current, newPass } = await req.json();
    if (typeof current !== "string" || typeof newPass !== "string" || newPass.length < 6 || newPass.length > 128) {
      return NextResponse.json(
        { message: "La nueva contraseña debe tener entre 6 y 128 caracteres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    if (!user.password) {
      return NextResponse.json({ message: "Esta cuenta no tiene contraseña establecida." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(current, user.password);
    if (!isValid) return NextResponse.json({ message: "Contraseña actual incorrecta" }, { status: 400 });

    const hashed = await hashPassword(newPass);
    // Bumping sessionVersion ends every other session and token. Previously a password change
    // evicted nobody, so changing it after a compromise did not remove the intruder.
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    });

    // The caller keeps their own session: mobile gets a fresh token, the web re-syncs through
    // the session update() call.
    const token = await reissueBearerToken(req, updated.sessionVersion);

    return NextResponse.json({ message: "Contraseña actualizada", ...(token ? { token } : {}) });
  } catch (e) {
    console.error("Error changing password:", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
