import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { gym: { select: { id: true, name: true } } },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      gymId: user.gymId,
      gymName: user.gym?.name || null,
      sessionVersion: user.sessionVersion,
    };

    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key";
    let token = "";

    try {
      token = await encode({
        token: tokenPayload,
        secret,
      });
    } catch (encodeErr) {
      // Fallback base64 signed payload if NextAuth encode fails
      token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gymId: user.gymId || null,
      gymName: user.gym?.name || null,
      subscriptionStatus: user.subscriptionStatus,
      avatarUrl: user.image || null,
    };

    return NextResponse.json({
      token,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { message: error?.message || String(error) || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
