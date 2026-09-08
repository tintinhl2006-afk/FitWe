import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateClassesFromTemplates } from "@/lib/classUtils";

export async function runGenerateClasses(): Promise<{ message: string; generated: number }> {
  const templates = await prisma.classTemplate.findMany();

  if (templates.length === 0) {
    return { message: "No hay plantillas", generated: 0 };
  }

  const generated = await generateClassesFromTemplates(templates, 14);

  return { message: `${generated} clases generadas`, generated };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isSecretValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const result = await runGenerateClasses();
    return NextResponse.json({ message: `CRON completado: ${result.message}`, generated: result.generated });
  } catch (error) {
    console.error("CRON generate-classes error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
