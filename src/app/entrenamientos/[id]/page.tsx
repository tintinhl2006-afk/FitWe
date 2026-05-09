"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, ArrowLeft, Loader2, Dumbbell, Trash2, Search, Target, Activity, Accessibility, BicepsFlexed, X, ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  lastHistory?: string;
  exerciseId: string;
}

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises: RoutineExercise[];
}

export default function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  
  const [selectedExercise, setSelectedExercise] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"picker" | "config">("picker");
  const [sets, setSets] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const fetchRoutineDetails = async () => {
    try {
      const res = await fetch(`/api/routines/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRoutine(data);
      } else {
        router.push("/entrenamientos");
      }
    } catch (error) {
      console.error("Error al cargar la rutina:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = await res.json();
        setAvailableExercises(data);
      }
    } catch (error) {
      console.error("Error al cargar catálogo de ejercicios:", error);
    }
  };

  useEffect(() => {
    fetchRoutineDetails();
    fetchExercises();
  }, [id]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    if (!replacingExerciseId && routine?.exercises?.some(re => re.exerciseId === selectedExercise)) {
      window.alert("Este ejercicio ya está en la rutina.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = replacingExerciseId 
        ? `/api/routines/${id}/exercises/${replacingExerciseId}`
        : `/api/routines/${id}/exercises`;
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
        await fetchRoutineDetails();
      }
    } catch (error) {
      console.error("Error al añadir ejercicio:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartWorkout = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: id }),
      });
      if (res.ok) {
        const session = await res.json();
        router.push(`/entrenamientos/en-vivo/${session.id}`);
      }
    } catch (error) {
      console.error("Error al iniciar entrenamiento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (routineExerciseId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ejercicio?")) return;
    try {
      const res = await fetch(`/api/routines/${id}/exercises/${routineExerciseId}`, { method: "DELETE" });
      if (res.ok) await fetchRoutineDetails();
    } catch (error) {
      console.error("Error al eliminar ejercicio:", error);
    }
  };

  const handleUpdateSets = async (routineExerciseId: string, delta: number, currentSets: number) => {
    const newSets = currentSets + delta;
    if (newSets < 1 || newSets > 10) return;
    setRoutine(prev => {
      if (!prev) return prev;
      return { ...prev, exercises: prev.exercises.map(re => re.id === routineExerciseId ? { ...re, sets: newSets } : re) };
    });
    try {
      await fetch(`/api/routines/${id}/exercises/${routineExerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: newSets }),
      });
    } catch (error) {
      console.error("Error updating sets:", error);
      fetchRoutineDetails();
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!routine || !routine.exercises) return;
    const newExercises = [...routine.exercises];
    if (direction === 'up' && index > 0) {
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    } else if (direction === 'down' && index < newExercises.length - 1) {
      [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
    } else return;
    const updatedOrder = newExercises.map((ex, i) => ({ ...ex, order: i }));
    setRoutine({ ...routine, exercises: updatedOrder });
    try {
      await fetch(`/api/routines/${id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderUpdates: updatedOrder.map((ex) => ({ id: ex.id, order: ex.order })) }),
      });
    } catch (error) {
      console.error("Error reordering:", error);
      fetchRoutineDetails();
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!routine) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/entrenamientos"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{routine.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Creada el {new Date(routine.createdAt).toLocaleDateString("es-ES")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setReplacingExerciseId(null); setStep("picker"); setIsModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Añadir Ejercicio
            </button>
            <button
              onClick={handleStartWorkout}
              disabled={isSubmitting || !routine.exercises?.length}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "💪 Comenzar"}
            </button>
          </div>
        </div>

        {routine.exercises && routine.exercises.length > 0 ? (
          <div className="flex flex-col gap-4">
            {routine.exercises.map((re, index) => (
              <div
                key={re.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm gap-4"
              >
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="flex flex-col gap-1 sm:hidden mr-2">
                    <button onClick={() => handleMoveOrder(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 dark:text-slate-600 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button onClick={() => handleMoveOrder(index, 'down')} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 dark:text-slate-600 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 dark:bg-slate-800">
                    {getExerciseIcon(re.exercise.equipment, re.exercise.muscleGroup)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{re.exercise.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {re.exercise.muscleGroup} {re.exercise.equipment && `• ${re.exercise.equipment}`}
                      </span>
                      {re.exercise.muscleGroup.toLowerCase() !== 'cardio' && (
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
                    <button onClick={() => handleMoveOrder(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 dark:text-slate-600 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button onClick={() => handleMoveOrder(index, 'down')} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 dark:text-slate-600 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={16} /></button>
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
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-500">Añade ejercicios para empezar.</p>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{step === "picker" ? "Biblioteca" : "Configurar"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="h-6 w-6" /></button>
              </div>
              {step === "picker" ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-6 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" placeholder="Buscar ejercicio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase())).map(ex => (
                        <button key={ex.id} onClick={() => { setSelectedExercise(ex.id); setStep("config"); setSets(ex.muscleGroup.toLowerCase() === 'cardio' ? 1 : 3); }} className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500 transition-all text-left">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-700">{getExerciseIcon(ex.equipment, ex.muscleGroup)}</div>
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
                    const exObj = availableExercises.find(e => e.id === selectedExercise);
                    if (!exObj) return null;
                    return (
                      <form onSubmit={handleAddExercise} className="space-y-6">
                        <div className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-700">{getExerciseIcon(exObj.equipment, exObj.muscleGroup)}</div>
                          <div><h4 className="font-bold text-slate-900 dark:text-white text-lg">{exObj.name}</h4><p className="text-sm text-slate-500">{exObj.muscleGroup}</p></div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                          {exObj.muscleGroup.toLowerCase() === 'cardio' ? (
                            <p className="text-slate-600 dark:text-slate-400">Cardio: 1 sesión</p>
                          ) : (
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Series Objetivo</label>
                            <input type="number" min="1" max="10" required value={sets} onChange={(e) => setSets(Number(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                          )}
                        </div>
                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                          <button type="button" onClick={() => setStep("picker")} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Volver</button>
                          <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir"}</button>
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
    </DashboardLayout>
  );
}
