import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassesFromTemplate } from "@/lib/classUtils";

export async function GET(req: Request) {
  try {
    // Auth Check: Either Bearer Secret (CRON) OR Session (Testing Lab)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    const session = await getServerSession(authOptions);
    const isSessionValid = session?.user?.role === "GYM";

    if (!isSecretValid && !isSessionValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Fetch ALL templates from ALL gyms
    const templates = await prisma.classTemplate.findMany({
      include: { gym: { select: { id: true } } },
    });

    if (templates.length === 0) {
      return NextResponse.json({ message: "No hay plantillas", generated: 0 });
    }

    let generated = 0;

    // Generate classes for the next 14 days
    for (const template of templates) {
      const count = await generateClassesFromTemplate(template, 14);
      generated += count;
    }

    return NextResponse.json({
      message: `CRON completado: ${generated} clases generadas`,
      generated,
    });
  } catch (error) {
    console.error("CRON generate-classes error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
