"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Dumbbell, Trash2, Edit2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Exercise {
  id: string;
  name: string;
}

interface RoutineExercise {
  id: string;
  exercise: Exercise;
}

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises?: RoutineExercise[];
}

interface ClientInfo {
  id: string;
  name: string;
  lastName: string | null;
}

export default function GymClientRoutinesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const router = useRouter();
  const { showConfirm } = useCustomAlert();

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClientInfo = async () => {
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      }
    } catch (e) {
      console.error("Error al cargar datos del cliente:", e);
    }
  };

  const fetchRoutines = async () => {
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}/routines`);
      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch (e) {
      console.error("Error al cargar rutinas:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientInfo();
    fetchRoutines();
  }, [clientId]);

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}/routines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoutineName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear la rutina");
      }

      const newRoutine = await res.json();
      setNewRoutineName("");
      setIsCreating(false);
      
      // Redirect to the newly created routine editor page
      router.push(`/admin-gym/clientes/${clientId}/rutinas/${newRoutine.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoutine = (id: string) => {
    showConfirm("¿Seguro que deseas eliminar esta rutina? Se perderán todos sus ejercicios y la asignación.", async () => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/routines/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await fetchRoutines();
        } else {
          console.error("Error al borrar rutina");
        }
      } catch (error) {
        console.error("Error al borrar rutina:", error);
      } finally {
        setDeletingId(null);
      }
    });
  };

  const clientFullName = client ? `${client.name} ${client.lastName || ""}`.trim() : "Cliente";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and title */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push(`/admin-gym/clientes/${clientId}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la ficha de {clientFullName}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Rutinas de {clientFullName}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Gestiona y asigna planes de entrenamiento personalizados para este cliente.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Rutina
          </button>
        </div>
      </div>

      {/* Routine Creator Form */}
      {isCreating && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-250">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Crear nueva rutina para {clientFullName}
          </h3>
          <form onSubmit={handleCreateRoutine} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Ej. Torso Fuerza, Rutina de Definición, etc."
                className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                required
              />
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 sm:flex-none rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newRoutineName.trim()}
                className="flex-1 sm:flex-none inline-flex min-w-[100px] items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-opacity-95 disabled:opacity-70 transition-colors"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear y Diseñar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routines Grid */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : routines.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-soft hover:border-primary dark:hover:border-cyan-400 transition-all"
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
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin-gym/clientes/${clientId}/rutinas/${routine.id}`}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                    title="Editar rutina"
                  >
                    <Edit2 className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm mb-4">
            <Dumbbell className="h-8 w-8 text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            El cliente no tiene rutinas
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Crea la primera rutina de entrenamiento haciendo clic en el botón de arriba para comenzar a estructurar sus entrenamientos.
          </p>
        </div>
      )}
    </div>
  );
}
