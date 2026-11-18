import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { readPageParams } from "@/lib/pagination";

/**
 * Historial persistente de accesos del gimnasio (tabla AccessLog), más reciente primero.
 *
 * Lo escriben los intentos validados desde la página de Acceso, la app y el programa de
 * recepción (bridge/), así que esta es la vista común de todos ellos. Solo devuelve los accesos
 * del gimnasio que consulta.
 */
export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (!auth?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const { page, pageSize, skip, take } = readPageParams(req.url, { defaultSize: 20, maxSize: 100 });
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const direction = sp.get("direction");

    const where: { gymId: string; status?: string; direction?: "ENTRY" | "EXIT" } = { gymId: auth.id };
    if (status === "GRANTED" || status === "DENIED") where.status = status;
    if (direction === "ENTRY" || direction === "EXIT") where.direction = direction;

    const [rows, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: {
          id: true,
          status: true,
          reason: true,
          direction: true,
          createdAt: true,
          user: { select: { name: true, lastName: true, email: true, image: true } },
        },
      }),
      prisma.accessLog.count({ where }),
    ]);

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        direction: r.direction,
        createdAt: r.createdAt.toISOString(),
        user: {
          name: [r.user.name, r.user.lastName].filter(Boolean).join(" "),
          email: r.user.email,
          image: r.user.image,
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Error listing gym access log:", error);
    return NextResponse.json({ message: "Error interno en el servidor" }, { status: 500 });
  }
}
