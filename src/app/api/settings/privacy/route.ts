import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isPrivate: true } });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  const { isPrivate } = await req.json();
  const user = await prisma.user.update({ where: { id: session.user.id }, data: { isPrivate } });
  return NextResponse.json(user);
}
