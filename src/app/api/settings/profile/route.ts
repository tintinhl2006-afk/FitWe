import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({}, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, bio: true, link: true }
    });

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({}, { status: 401 });

    const body = await req.json();
    const { name, bio, link } = body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, bio, link }
    });

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
