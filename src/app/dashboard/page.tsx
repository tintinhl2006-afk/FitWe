"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, Apple, Dumbbell, Loader2, ArrowRight, Flame, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionBanner } from "@/components/shared/SubscriptionBanner";

interface DashboardStats {
  routinesCount: number;
  lastWorkoutDate: string | null;
}

interface FoodEntry {
  calories: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [caloriesToday, setCaloriesToday] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    routinesCount: 0,
    lastWorkoutDate: null,
  });

  const GOAL_CALORIES = 2500; // Objetivo diario de ejemplo

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const nowReference = session?.user?.serverNow 
          ? new Date(session.user.serverNow) 
          : new Date();
        const today = nowReference.toISOString().split("T")[0];
        
        // Fetch paralelo para optimizar
        const [nutritionRes, statsRes] = await Promise.all([
          fetch(`/api/nutrition?date=${today}`),
          fetch("/api/dashboard")
        ]);

        if (nutritionRes.ok) {
          const data = await nutritionRes.json();
          const foods: FoodEntry[] = data.entries || [];
          const totalCals = foods.reduce((acc, food) => acc + food.calories, 0);
          setCaloriesToday(totalCals);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const caloriesPercentage = Math.min(Math.round((caloriesToday / GOAL_CALORIES) * 100), 100);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Cabecera dinámica */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            ¡Hola, <span className="text-primary dark:text-cyan-400">{session?.user?.name?.split(' ')[0] || "Deportista"}</span>!
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Aquí tienes tu resumen de hoy.
          </p>
        </div>

        <SubscriptionBanner />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Tarjetas de Resumen Diario */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              
              {/* Tarjeta 1: Nutrición */}
              <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400">
                    <Apple className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Nutrición Hoy</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Calorías consumidas</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {caloriesToday} <span className="text-base font-normal text-slate-500 dark:text-slate-400">kcal</span>
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      / {GOAL_CALORIES} kcal
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        caloriesPercentage > 100 ? "bg-red-500" : "bg-orange-500 dark:bg-orange-600"
                      )}
                      style={{ width: `${caloriesPercentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
                    Llevas el {caloriesPercentage}% de tu objetivo
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: Entrenamiento */}
              <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Mis Planes</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Rutinas creadas</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {stats.routinesCount}
                  </span>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {stats.routinesCount === 1 ? "Rutina lista" : "Rutinas listas"} para entrenar
                  </p>
                </div>
              </div>

              {/* Tarjeta 3: Actividad */}
              <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Actividad</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Último entrenamiento</p>
                  </div>
                </div>
                <div className="mt-auto">
                  {stats.lastWorkoutDate ? (
                    <>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {new Date(stats.lastWorkoutDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </span>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        Mantén el ritmo
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        Aún sin registros
                      </span>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        ¡Es hora de sudar un poco!
                      </p>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Accesos Rápidos */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Accesos Rápidos</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/nutricion"
                  className="group flex items-center justify-between rounded-3xl bg-slate-900 dark:bg-primary p-4 text-white shadow-sm transition-all hover:bg-slate-800 dark:hover:bg-primary hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-2">
                      <Apple className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Registrar Comida</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/gimnasio"
                  className="group flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-slate-900 dark:text-white shadow-sm transition-all hover:border-primary dark:hover:border-cyan-400 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 p-2 text-primary dark:text-cyan-400">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Ir al Gimnasio</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/entrenamientos"
                  className="group flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-slate-900 dark:text-white shadow-sm transition-all hover:border-primary dark:hover:border-cyan-400 hover:shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 p-2 text-primary dark:text-cyan-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Ver Mis Rutinas</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
