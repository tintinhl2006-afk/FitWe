"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Dumbbell,
  Trash2,
  Search,
  Target,
  Activity,
  Accessibility,
  BicepsFlexed,
  X,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
}

interface RoutineExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  order: number;
  exerciseId: string;
}

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises: RoutineExercise[];
}

interface RoutineBuilderProps {
  /** If provided, the gym is building a routine for this client */
  clientId?: string;
  /** Base API path for routine operations. Defaults to "/api/routines" */
  apiBasePath?: string;
  /** Where to redirect after successful creation */
  redirectAfterCreate?: string;
  /** Back link URL */
  backUrl: string;
  /** Back link label */
  backLabel?: string;
}

export function RoutineBuilder({
  clientId,
  apiBasePath,
  redirectAfterCreate,
  backUrl,
  backLabel = "Volver",
}: RoutineBuilderProps) {
  const router = useRouter();

  // Phase: "create" (name input) or "edit" (exercise management)
  const [phase, setPhase] = useState<"create" | "edit">("create");
  const [routineName, setRoutineName] = useState("");
  const [routine, setRoutine] = useState<Routine | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Exercise picker
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [step, setStep] = useState<"picker" | "config">("picker");
  const [sets, setSets] = useState(3);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  const getExerciseIcon = (equipment: string | null, muscleGroup: string) => {
    const lowerGroup = muscleGroup.toLowerCase();
    const lowerEq = equipment?.toLowerCase() || "";
    if (lowerGroup === "cardio") return <Activity size={20} className="text-blue-400" />;
    if (lowerEq === "mancuernas") return <Dumbbell size={20} className="text-amber-400" />;
    if (lowerEq === "peso corporal") return <Accessibility size={20} className="text-green-400" />;
    if (lowerEq === "barra" || lowerEq === "máquina" || lowerEq === "polea") return <Target size={20} className="text-indigo-400" />;
    return <BicepsFlexed size={20} className="text-slate-400" />;
  };

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch("/api/exercises");
        if (res.ok) setAvailableExercises(await res.json());
      } catch (e) {
        console.error("Error loading exercises:", e);
      }
    };
    fetchExercises();
  }, []);

  // ── Phase 1: Create the routine ──
  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      // If clientId provided, use the gym API, otherwise user API
      const url = clientId
        ? `/api/admin-gym/clients/${clientId}/routines`
        : "/api/routines";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: routineName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear la rutina");
      }

      const newRoutine = await res.json();
      setRoutine({ ...newRoutine, exercises: [] });
      setPhase("edit");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Phase 2: Add exercises ──
  const fetchRoutineDetails = async (routineId: string) => {
    try {
      const res = await fetch(`/api/routines/${routineId}`);
      if (res.ok) setRoutine(await res.json());
    } catch (e) {
      console.error("Error fetching routine:", e);
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise || !routine) return;

    if (!replacingExerciseId && routine.exercises?.some((re) => re.exerciseId === selectedExercise)) {
      window.alert("Este ejercicio ya está en la rutina.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = replacingExerciseId
        ? `/api/routines/${routine.id}/exercises/${replacingExerciseId}`
        : `/api/routines/${routine.id}/exercises`;
      const method = replacingExerciseId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: selectedExercise, sets: Number(sets), reps: 0, weight: 0 }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setStep("picker");
        setSelectedExercise("");
        setSets(3);
        setReplacingExerciseId(null);
        await fetchRoutineDetails(routine.id);
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (routineExerciseId: string) => {
    if (!routine || !window.confirm("¿Seguro que quieres eliminar este ejercicio?")) return;
    try {
      const res = await fetch(`/api/routines/${routine.id}/exercises/${routineExerciseId}`, { method: "DELETE" });
      if (res.ok) await fetchRoutineDetails(routine.id);
    } catch (e) {
      console.error("Error deleting exercise:", e);
    }
  };

  const handleUpdateSets = async (routineExerciseId: string, delta: number, currentSets: number) => {
    if (!routine) return;
    const newSets = currentSets + delta;
    if (newSets < 1 || newSets > 10) return;

    setRoutine((prev) => {
      if (!prev) return prev;
      return { ...prev, exercises: prev.exercises.map((re) => (re.id === routineExerciseId ? { ...re, sets: newSets } : re)) };
    });

    try {
      await fetch(`/api/routines/${routine.id}/exercises/${routineExerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: newSets }),
      });
    } catch (e) {
      console.error("Error updating sets:", e);
      fetchRoutineDetails(routine.id);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (!routine?.exercises) return;
    const newExercises = [...routine.exercises];
    if (direction === "up" && index > 0) {
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    } else if (direction === "down" && index < newExercises.length - 1) {
      [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
    } else return;

    const updatedOrder = newExercises.map((ex, i) => ({ ...ex, order: i }));
    setRoutine({ ...routine, exercises: updatedOrder });

    try {
      await fetch(`/api/routines/${routine.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderUpdates: updatedOrder.map((ex) => ({ id: ex.id, order: ex.order })) }),
      });
    } catch (e) {
      console.error("Error reordering:", e);
      fetchRoutineDetails(routine.id);
    }
  };

  const handleFinish = () => {
    if (redirectAfterCreate) {
      router.push(redirectAfterCreate);
    } else {
      router.push(backUrl);
    }
  };

  // ── RENDER: Phase 1 — Create routine name ──
  if (phase === "create") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => router.push(backUrl)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          ← {backLabel}
        </button>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {clientId ? "Asignar Nueva Rutina" : "Crear Nueva Rutina"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {clientId
                ? "Esta rutina aparecerá automáticamente en la app del cliente."
                : "Dale un nombre a tu nuevo plan de entrenamiento."}
            </p>
          </div>

          <form onSubmit={handleCreateRoutine} className="px-7 py-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nombre de la rutina
              </label>
              <input
                type="text"
                required
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Ej: Día 1 - Pecho y Tríceps"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(backUrl)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !routineName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER: Phase 2 — Edit exercises ──
  if (!routine) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{routine.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {clientId ? "Añade ejercicios a la rutina del cliente" : "Gestiona los ejercicios de esta rutina"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setReplacingExerciseId(null); setStep("picker"); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Añadir Ejercicio
          </button>
          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar
          </button>
        </div>
      </div>

      {/* Exercise List */}
      {routine.exercises && routine.exercises.length > 0 ? (
        <div className="flex flex-col gap-4">
          {routine.exercises.map((re, index) => (
            <div
              key={re.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm gap-4"
            >
              <div className="flex items-center gap-4 flex-1 w-full">
                <div className="flex flex-col gap-1 sm:hidden mr-2">
                  <button onClick={() => handleMoveOrder(index, "up")} disabled={index === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button onClick={() => handleMoveOrder(index, "down")} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800">
                  {getExerciseIcon(re.exercise.equipment, re.exercise.muscleGroup)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{re.exercise.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {re.exercise.muscleGroup} {re.exercise.equipment && `• ${re.exercise.equipment}`}
                    </span>
                    {re.exercise.muscleGroup.toLowerCase() !== "cardio" && (
                      <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-full px-1 py-0.5 border border-indigo-100 dark:border-indigo-900/50">
                        <button onClick={() => handleUpdateSets(re.id, -1, re.sets)} disabled={re.sets <= 1} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">-</button>
                        <span className="text-xs font-semibold w-12 text-center select-none">{re.sets} Series</span>
                        <button onClick={() => handleUpdateSets(re.id, 1, re.sets)} disabled={re.sets >= 10} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                <div className="hidden sm:flex flex-col gap-0 mr-2">
                  <button onClick={() => handleMoveOrder(index, "up")} disabled={index === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button onClick={() => handleMoveOrder(index, "down")} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                </div>
                <button onClick={() => { setReplacingExerciseId(re.id); setStep("picker"); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  <RefreshCcw size={16} /> <span className="hidden sm:inline">Cambiar</span>
                </button>
                <button onClick={() => handleDeleteExercise(re.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-100 dark:border-red-900/50">
                  <Trash2 size={16} /> <span className="hidden sm:inline">Quitar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 text-center">
          <Dumbbell className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rutina vacía</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Añade ejercicios para empezar.</p>
          <button
            onClick={() => { setReplacingExerciseId(null); setStep("picker"); setIsModalOpen(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Añadir primer ejercicio
          </button>
        </div>
      )}

      {/* ── Exercise Picker Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {step === "picker" ? "Biblioteca" : "Configurar"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {step === "picker" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar ejercicio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableExercises
                      .filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => { setSelectedExercise(ex.id); setStep("config"); setSets(ex.muscleGroup.toLowerCase() === "cardio" ? 1 : 3); }}
                          className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all text-left"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                            {getExerciseIcon(ex.equipment, ex.muscleGroup)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-semibold text-slate-900 dark:text-white truncate">{ex.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{ex.muscleGroup}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-slate-900">
                {(() => {
                  const exObj = availableExercises.find((e) => e.id === selectedExercise);
                  if (!exObj) return null;
                  return (
                    <form onSubmit={handleAddExercise} className="space-y-6">
                      <div className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                          {getExerciseIcon(exObj.equipment, exObj.muscleGroup)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{exObj.name}</h4>
                          <p className="text-sm text-slate-500">{exObj.muscleGroup}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                        {exObj.muscleGroup.toLowerCase() === "cardio" ? (
                          <p className="text-slate-600 dark:text-slate-400">Cardio: 1 sesión</p>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Series Objetivo</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              required
                              value={sets}
                              onChange={(e) => setSets(Number(e.target.value))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-8 flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                        <button type="button" onClick={() => setStep("picker")} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          Volver
                        </button>
                        <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir"}
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
