"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Loader2, Dumbbell, Calendar, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SubscriptionBanner, useIsSubscriptionActive } from "@/components/shared/SubscriptionBanner";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises?: {
    exercise: {
      name: string;
    };
  }[];
}

export default function EntrenamientosPage() {
  const isActive = useIsSubscriptionActive();
  const { showConfirm } = useCustomAlert();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRoutines = async () => {
    if (!isActive) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/routines");
      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch (error) {
      console.error("Error al cargar rutinas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, [isActive]);

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;
    if (!isActive) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoutineName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear la rutina");
      }

      setNewRoutineName("");
      setIsCreating(false);
      await fetchRoutines();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoutine = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!isActive) return;
    showConfirm("¿Seguro que quieres borrar esta rutina? Se perderán todos sus ejercicios.", async () => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/routines/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await fetchRoutines();
        } else {
          const data = await res.json();
          console.error("Error deleting routine:", data.message);
        }
      } catch (error) {
        console.error("Error al borrar rutina:", error);
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mis Rutinas
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Gestiona tus planes de entrenamiento personales.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            disabled={!isActive}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-primary transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nueva Rutina
          </button>
        </div>

        <SubscriptionBanner />

        {isActive && isCreating && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Crear nueva rutina
            </h3>
            <form onSubmit={handleCreateRoutine} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                  required
                />
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRoutineName.trim()}
                  className="inline-flex min-w-[100px] items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-70 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : routines.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {routines.map((routine) => (
              <Link
                href={`/entrenamientos/${routine.id}`}
                key={routine.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-soft hover:border-primary dark:hover:border-cyan-400 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate">
                      {routine.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {routine.exercises && routine.exercises.length > 0
                        ? routine.exercises.map((e) => e.exercise.name).join(", ")
                        : "Sin ejercicios añadidos"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteRoutine(e, routine.id);
                      }}
                      disabled={deletingId === routine.id}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors disabled:opacity-50"
                      title="Eliminar rutina"
                    >
                      {deletingId === routine.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                    <div className="p-2 text-slate-400 dark:text-slate-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-16 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm mb-4">
              <Dumbbell className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No tienes rutinas
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Crea tu primera rutina de entrenamiento haciendo clic en el botón de arriba para comenzar a registrar tu progreso.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
