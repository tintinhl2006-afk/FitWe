import { NextResponse } from "next/server";
import { isValidCronRequest } from "@/lib/cronAuth";
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
    if (!isValidCronRequest(req)) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const result = await runGenerateClasses();
    return NextResponse.json({ message: `CRON completado: ${result.message}`, generated: result.generated });
  } catch (error) {
    console.error("CRON generate-classes error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
