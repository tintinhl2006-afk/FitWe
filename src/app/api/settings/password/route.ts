import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getRequestUserId } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { current, newPass } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    const isValid = await bcrypt.compare(current, user.password);
    if (!isValid) return NextResponse.json({ message: "Contraseña actual incorrecta" }, { status: 400 });

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ message: "Contraseña actualizada" });
  } catch (e) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
