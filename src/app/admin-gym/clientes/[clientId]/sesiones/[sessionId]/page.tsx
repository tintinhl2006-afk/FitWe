"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Dumbbell,
  Clock,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  Weight,
  Target,
  Activity,
  Accessibility,
  BicepsFlexed,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetData {
  setNumber: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

interface ExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  sets: SetData[];
}

interface SessionDetail {
  id: string;
  clientName: string;
  routineName: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  totalVolume: number;
  exercises: ExerciseGroup[];
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; sessionId: string }>;
}) {
  const { clientId, sessionId } = use(params);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(
          `/api/admin-gym/clients/${clientId}/sessions/${sessionId}`
        );
        if (res.ok) {
          setSession(await res.json());
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [clientId, sessionId]);

  const getExerciseIcon = (equipment: string | null, muscleGroup: string) => {
    const g = muscleGroup.toLowerCase();
    const e = equipment?.toLowerCase() || "";
    if (g === "cardio") return <Activity size={18} className="text-blue-400" />;
    if (e === "mancuernas") return <Dumbbell size={18} className="text-amber-400" />;
    if (e === "peso corporal") return <Accessibility size={18} className="text-green-400" />;
    if (e === "barra" || e === "máquina" || e === "polea") return <Target size={18} className="text-indigo-400" />;
    return <BicepsFlexed size={18} className="text-slate-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/admin-gym/clientes/${clientId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al cliente
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Sesión no encontrada
          </h3>
          <p className="text-slate-500 max-w-sm">
            Esta sesión no existe o no pertenece a tu gimnasio.
          </p>
        </div>
      </div>
    );
  }

  const dateStr = new Date(session.startTime).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = new Date(session.startTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href={`/admin-gym/clientes/${clientId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil del cliente
      </Link>

      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600" />
        <div className="px-6 pb-6 -mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white dark:border-slate-900 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shadow-lg mb-4">
            <Dumbbell className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {session.routineName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
            {dateStr} · {timeStr}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Entrenamiento de {session.clientName}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 border border-emerald-100 dark:border-emerald-900/50">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {session.durationMinutes} min
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 border border-indigo-100 dark:border-indigo-900/50">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {session.totalVolume.toLocaleString()} kg vol.
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-100 dark:border-slate-700">
              <Dumbbell className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {session.exercises.length} ejercicio{session.exercises.length !== 1 && "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {session.exercises.map((ex) => {
          const isCardio = ex.muscleGroup.toLowerCase() === "cardio";
          return (
            <div
              key={ex.exerciseId}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900">
                  {getExerciseIcon(ex.equipment, ex.muscleGroup)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {ex.exerciseName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ex.muscleGroup}
                    {ex.equipment && ` · ${ex.equipment}`}
                  </p>
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {ex.sets.length} serie{ex.sets.length !== 1 && "s"}
                </span>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-2.5 text-left">Serie</th>
                      {isCardio ? (
                        <th className="px-6 py-2.5 text-right">Tiempo (min)</th>
                      ) : (
                        <>
                          <th className="px-6 py-2.5 text-right">Peso (kg)</th>
                          <th className="px-6 py-2.5 text-right">Reps</th>
                        </>
                      )}
                      <th className="px-6 py-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {ex.sets.map((s) => (
                      <tr
                        key={s.setNumber}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">
                          #{s.setNumber}
                        </td>
                        {isCardio ? (
                          <td className="px-6 py-3 text-right font-mono text-slate-900 dark:text-white">
                            {s.reps}
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-3 text-right font-mono text-slate-900 dark:text-white">
                              {s.weight}
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-slate-900 dark:text-white">
                              {s.reps}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                              s.isCompleted
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}
                          >
                            {s.isCompleted ? "✓" : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {session.exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Dumbbell className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
          <p className="text-sm text-slate-500">
            No se registraron ejercicios en esta sesión.
          </p>
        </div>
      )}
    </div>
  );
}
