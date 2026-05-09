import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    // Buscar todos los sets completados del usuario para este ejercicio
    const sets = await prisma.workoutSet.findMany({
      where: {
        exerciseId: id,
        isCompleted: true,
        session: {
          userId: session.user.id,
        },
      },
      include: {
        session: {
          include: {
            routine: true,
          },
        },
      },
      orderBy: {
        session: {
          startTime: "desc",
        },
      },
    });

    // Agrupar los sets por sesión para facilitar el renderizado en el frontend
    const historyBySession: Record<string, any> = {};

    sets.forEach((set) => {
      const sessionId = set.session.id;
      if (!historyBySession[sessionId]) {
        historyBySession[sessionId] = {
          sessionId,
          date: set.session.endTime || set.session.startTime, // Preferir endTime si se completó
          routineName: set.session.routine?.name || "Entrenamiento Libre",
          sets: [],
        };
      }
      historyBySession[sessionId].sets.push({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
      });
    });

    // Convertir a array y ordenar (aunque ya viene ordenado por Prisma, agruparlo con Object.values puede perder el orden en algunos motores de JS)
    const sortedHistory = Object.values(historyBySession).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Calcular chartData agrupado por fecha (cronológico)
    const chartDataMap: Record<string, any> = {};

    // Invertimos sortedHistory para procesar cronológicamente (más antiguo a más nuevo)
    const chronologicalHistory = [...sortedHistory].reverse();

    chronologicalHistory.forEach((session: any) => {
      const dateObj = new Date(session.date);
      const dateStr = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
      
      let maxWeight = 0;
      let maxEpley = 0;
      let totalVolume = 0;

      session.sets.forEach((set: any) => {
        const weight = set.weight;
        const reps = set.reps;
        const volume = weight * reps;
        const epley = weight * (1 + reps / 30);

        if (weight > maxWeight) maxWeight = weight;
        if (epley > maxEpley) maxEpley = epley;
        totalVolume += volume;
      });

      if (!chartDataMap[dateStr]) {
        chartDataMap[dateStr] = {
          date: dateStr,
          pesoMaximo: maxWeight,
          repeticionMaxima: Math.round(maxEpley),
          volumenTotal: totalVolume,
        };
      } else {
        if (maxWeight > chartDataMap[dateStr].pesoMaximo) {
          chartDataMap[dateStr].pesoMaximo = maxWeight;
        }
        if (Math.round(maxEpley) > chartDataMap[dateStr].repeticionMaxima) {
          chartDataMap[dateStr].repeticionMaxima = Math.round(maxEpley);
        }
        chartDataMap[dateStr].volumenTotal += totalVolume;
      }
    });

    const chartData = Object.values(chartDataMap);

    return NextResponse.json({ history: sortedHistory, chartData });
  } catch (error) {
    console.error("Error fetching exercise history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
