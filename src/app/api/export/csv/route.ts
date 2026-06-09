import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener todas las sesiones del usuario con sus series y ejercicios
    const workoutSessions = await prisma.workoutSession.findMany({
      where: { userId, endTime: { not: null } },
      include: {
        routine: { select: { name: true } },
        workoutSets: {
          include: {
            exercise: { select: { name: true, equipment: true, muscleGroup: true } }
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Funciones de utilidad
    const formatDate = (date: Date) => {
      if (!date) return '""';
      const d = new Date(date);
      const datePart = d.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
      const timePart = d.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
      return `"${datePart}, ${timePart}"`;
    };

    // Construir CSV
    // Cabeceras exactas (Strong/Hevy format)
    const rows = [
      "title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe"
    ];

    workoutSessions.forEach(ws => {
      const startTimeStr = formatDate(ws.startTime);
      const endTimeStr = ws.endTime ? formatDate(ws.endTime) : '""';
      const routineName = `"${ws.className || ws.routine?.name || "Entrenamiento Libre"}"`;
      const description = '""';
      
      const exerciseSetCounts: Record<string, number> = {};

      ws.workoutSets.forEach(set => {
        const exerciseNameStr = `"${set.exercise.name}"`;
        
        if (exerciseSetCounts[set.exercise.name] === undefined) {
          exerciseSetCounts[set.exercise.name] = 0;
        }
        const set_index = exerciseSetCounts[set.exercise.name]++;

        const isCardio = set.exercise.muscleGroup.toLowerCase() === 'cardio';
        const isBodyweight = set.exercise.equipment?.toLowerCase() === 'peso corporal';

        let weight_kg = '""';
        let reps = '""';
        let duration_seconds = '""';

        if (isCardio) {
          duration_seconds = set.reps ? (set.reps * 60).toString() : '""';
        } else if (isBodyweight) {
          reps = set.reps ? set.reps.toString() : '""';
        } else {
          weight_kg = set.weight ? set.weight.toString() : '""';
          reps = set.reps ? set.reps.toString() : '""';
        }

        const row = [
          routineName,          // title
          startTimeStr,         // start_time
          endTimeStr,           // end_time
          description,          // description
          exerciseNameStr,      // exercise_title
          '""',                 // superset_id
          '""',                 // exercise_notes
          set_index.toString(), // set_index
          '"normal"',           // set_type
          weight_kg,            // weight_kg
          reps,                 // reps
          '""',                 // distance_km
          duration_seconds,     // duration_seconds
          '""'                  // rpe
        ];

        rows.push(row.join(","));
      });
    });

    const csvContent = rows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="fitwe_export.csv"',
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
