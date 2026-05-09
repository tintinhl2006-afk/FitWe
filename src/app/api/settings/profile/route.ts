import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, bio: true, link: true }
    });

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

    const body = await req.json();
    const { name, bio, link } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, bio, link }
    });

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
