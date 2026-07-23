import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const tokenString = authHeader.substring(7);
    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key";

    let userId: string | null = null;

    try {
      const decoded = await decode({ token: tokenString, secret });
      if (decoded && decoded.id) {
        userId = decoded.id as string;
      }
    } catch (e) {
      // Fallback base64 decoding
      try {
        const parsed = JSON.parse(Buffer.from(tokenString, "base64").toString("utf-8"));
        if (parsed && parsed.id) {
          userId = parsed.id;
        }
      } catch (err) {
        userId = null;
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        gymId: true,
        image: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        gym: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        gymId: user.gymId || null,
        gymName: user.gym?.name || null,
        subscriptionStatus: user.subscriptionStatus,
        avatarUrl: user.image || null,
      },
    });
  } catch (error: any) {
    console.error("User me error:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
