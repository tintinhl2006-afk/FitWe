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
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({}, { status: 401 });

    const body = await req.json();
    const { name, bio, link } = body;

    // These values are shown to gym staff and exported to spreadsheets, so they are validated
    // here. They used to be written raw, and the whole user row (password hash included) was
    // sent back in the response.
    const invalid = (what: string) =>
      NextResponse.json({ message: `Valor no válido: ${what}` }, { status: 400 });

    const data: { name?: string; bio?: string | null; link?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) return invalid("nombre");
      data.name = name.trim();
    }
    if (bio !== undefined) {
      if (bio !== null && (typeof bio !== "string" || bio.length > 500)) return invalid("biografía");
      data.bio = bio === null || bio === "" ? null : bio;
    }
    if (link !== undefined) {
      if (link !== null && (typeof link !== "string" || link.length > 200)) return invalid("enlace");
      if (typeof link === "string" && /^\s*(javascript|data|vbscript):/i.test(link)) return invalid("enlace");
      data.link = link === null || link === "" ? null : link.trim();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { name: true, bio: true, link: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
