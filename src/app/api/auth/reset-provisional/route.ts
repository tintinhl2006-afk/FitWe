import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { password } = parsed.data;

    // This route exists for ONE flow: replacing a password the gym issued. It used to accept
    // any authenticated session on any account, so holding a cookie was enough to take the
    // account over permanently, silently and without knowing the current password. The state
    // is read from the database, never from the token (whose claims the client can influence).
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true },
    });
    if (!account?.mustChangePassword) {
      return NextResponse.json(
        { message: "Esta acción solo está disponible para contraseñas provisionales. Usa Ajustes > Contraseña." },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password.trim());

    // Update the database. sessionVersion is bumped so every OTHER session issued with the
    // old provisional password dies; the caller's own session re-syncs through update().
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: "Contraseña actualizada con éxito.",
    });
  } catch (error) {
    console.error("Error setting provisional password:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
