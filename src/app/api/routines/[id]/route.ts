import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";

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

    // Validar formato UUID para evitar errores de Prisma (ej. cuando id='en-vivo')
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const routine = await verifyRoutineAccess(id, session.user.id, session.user.role);

    if (!routine) {
      return NextResponse.json(
        { message: "Rutina no encontrada" },
        { status: 404 }
      );
    }

    // Fetch full routine with exercises
    const fullRoutine = await prisma.routine.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: { exercise: true },
        },
      },
    });

    if (!fullRoutine) {
      return NextResponse.json({ message: "Rutina no encontrada" }, { status: 404 });
    }

    // Buscar historial reciente para cada ejercicio
    const routineOwnerId = fullRoutine.userId;
    const exercisesWithHistory = await Promise.all(
      fullRoutine.exercises.map(async (re) => {
        // Encontrar la última sesión donde se hizo este ejercicio
        const lastSessionSet = await prisma.workoutSet.findFirst({
          where: {
            exerciseId: re.exerciseId,
            isCompleted: true,
            session: {
              userId: routineOwnerId
            }
          },
          orderBy: {
            session: {
              startTime: 'desc'
            }
          },
          select: {
            sessionId: true,
          }
        });

        let historyText = "Sin registros previos";

        if (lastSessionSet) {
          // Obtener todos los sets de ese ejercicio en esa sesión
          const allSetsFromLastSession = await prisma.workoutSet.findMany({
            where: {
              sessionId: lastSessionSet.sessionId,
              exerciseId: re.exerciseId,
              isCompleted: true,
            },
            orderBy: {
              id: 'asc'
            }
          });

          if (allSetsFromLastSession.length > 0) {
            if (re.exercise.muscleGroup.toLowerCase() === 'cardio') {
              const totalMin = allSetsFromLastSession.reduce((acc, s) => acc + s.reps, 0);
              historyText = `Último registro: ${totalMin} min`;
            } else if (re.exercise.equipment?.toLowerCase() === 'peso corporal') {
              const repsStr = allSetsFromLastSession.map(s => `${s.reps}`).join(", ");
              historyText = `Último registro: ${repsStr} reps`;
            } else {
              const setsStr = allSetsFromLastSession.map(s => `${s.weight}kg x ${s.reps}`).join(", ");
              historyText = `Último registro: ${setsStr}`;
            }
          }
        }

        return {
          ...re,
          lastHistory: historyText
        };
      })
    );

    return NextResponse.json({ ...fullRoutine, exercises: exercisesWithHistory });
  } catch (error) {
    console.error("Error fetching routine detail:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verificar acceso (usuario dueño O gimnasio del cliente)
    const routine = await verifyRoutineAccess(id, session.user.id, session.user.role);

    if (!routine) {
      return NextResponse.json(
        { message: "Rutina no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    // Ejecutar borrado en transaccion para limpiar RoutineExercise primero
    await prisma.$transaction([
      prisma.routineExercise.deleteMany({
        where: { routineId: id },
      }),
      prisma.routine.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ message: "Rutina eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
