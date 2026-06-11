"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Plus,
  Minus,
  ArrowLeft,
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

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
  repsList?: string | null;
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
  const { showConfirm, showAlert } = useCustomAlert();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  const [selectedExercise, setSelectedExercise] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [step, setStep] = useState<"picker" | "config">("picker");
  const [sets, setSets] = useState(3);
  const [repsPerSet, setRepsPerSet] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
  const [hasTargetReps, setHasTargetReps] = useState(true);

  useEffect(() => {
    setRepsPerSet((prev) => {
      const arr = [...prev];
      if (arr.length < sets) {
        while (arr.length < sets) {
          arr.push(10);
        }
      } else if (arr.length > sets) {
        arr.length = sets;
      }
      return arr;
    });
  }, [sets]);

  const getExerciseIcon = (equipment: string | null, muscleGroup: string) => {
    const lowerGroup = muscleGroup.toLowerCase();
    const lowerEq = equipment?.toLowerCase() || "";
    if (lowerGroup === "cardio") return <Activity size={20} className="text-blue-400" />;
    if (lowerEq === "mancuernas") return <Dumbbell size={20} className="text-amber-400" />;
    if (lowerEq === "peso corporal") return <Accessibility size={20} className="text-green-400" />;
    if (lowerEq === "barra" || lowerEq === "máquina" || lowerEq === "polea") return <Target size={20} className="text-cyan-400" />;
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

    if (!replacingExerciseId && routine?.exercises?.some((re) => re.exerciseId === selectedExercise)) {
      showAlert("Este ejercicio ya está en la rutina.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = replacingExerciseId
        ? `/api/routines/${id}/exercises/${replacingExerciseId}`
        : `/api/routines/${id}/exercises`;
      const method = replacingExerciseId ? "PATCH" : "POST";
      const targetReps = repsPerSet[0] !== undefined ? repsPerSet[0] : 10;
      const repsList = hasTargetReps ? repsPerSet.join(",") : null;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: selectedExercise,
          sets: Number(sets),
          reps: targetReps,
          repsList,
          weight: 0
        }),
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

  const handleDeleteExercise = (routineExerciseId: string) => {
    showConfirm("¿Seguro que quieres eliminar este ejercicio?", async () => {
      try {
        const res = await fetch(`/api/routines/${id}/exercises/${routineExerciseId}`, { method: "DELETE" });
        if (res.ok) await fetchRoutineDetails();
      } catch (error) {
        console.error("Error al eliminar ejercicio:", error);
      }
    });
  };

  const handleUpdateSets = async (routineExerciseId: string, delta: number, currentSets: number) => {
    const newSets = currentSets + delta;
    if (newSets < 1 || newSets > 9) return;

    if (!routine) return;

    // Adjust repsList size to match new set count
    const targetEx = routine.exercises.find((item) => item.id === routineExerciseId);
    let updatedRepsList = "";
    if (targetEx) {
      const currentRepsArray = targetEx.repsList
        ? targetEx.repsList.split(",").map((val) => parseInt(val.trim(), 10) || targetEx.reps)
        : Array(currentSets).fill(targetEx.reps);

      if (currentRepsArray.length < newSets) {
        while (currentRepsArray.length < newSets) {
          currentRepsArray.push(targetEx.reps || 10);
        }
      } else if (currentRepsArray.length > newSets) {
        currentRepsArray.length = newSets;
      }
      updatedRepsList = currentRepsArray.join(",");
    }

    setRoutine((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((re) =>
          re.id === routineExerciseId ? { ...re, sets: newSets, repsList: updatedRepsList } : re
        )
      };
    });

    try {
      await fetch(`/api/routines/${id}/exercises/${routineExerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: newSets, repsList: updatedRepsList }),
      });
    } catch (error) {
      console.error("Error updating sets:", error);
      fetchRoutineDetails();
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (!routine || !routine.exercises) return;
    const newExercises = [...routine.exercises];
    if (direction === "up" && index > 0) {
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    } else if (direction === "down" && index < newExercises.length - 1) {
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

  const getRepsArray = (re: RoutineExercise) => {
    if (re.repsList) {
      return re.repsList.split(",").map((val) => parseInt(val.trim(), 10) || re.reps);
    }
    return Array(re.sets).fill(re.reps || 10);
  };

  if (!routine) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/entrenamientos"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{routine.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Creada el {new Date(routine.createdAt).toLocaleDateString("es-ES")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => { setReplacingExerciseId(null); setStep("picker"); setIsModalOpen(true); }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4 text-primary" />
              Añadir Ejercicio
            </button>
            <button
              onClick={handleStartWorkout}
              disabled={isSubmitting || !routine.exercises?.length}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-75"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comenzar Entrenamiento"}
            </button>
          </div>
        </div>

        {routine.exercises && routine.exercises.length > 0 ? (
          <div className="flex flex-col gap-4">
            {routine.exercises.map((re, index) => (
              <div
                key={re.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-4"
              >
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="flex flex-col gap-1 sm:hidden mr-2">
                    <button onClick={() => handleMoveOrder(index, "up")} disabled={index === 0} className="p-1 text-slate-400 hover:text-primary disabled:opacity-20 transition-colors"><ArrowUp size={16} /></button>
                    <button onClick={() => handleMoveOrder(index, "down")} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 hover:text-primary disabled:opacity-20 transition-colors"><ArrowDown size={16} /></button>
                  </div>
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    {re.exercise.imageUrl ? (
                      <Image src={re.exercise.imageUrl} alt={re.exercise.name} fill className="object-cover" />
                    ) : (
                      getExerciseIcon(re.exercise.equipment, re.exercise.muscleGroup)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{re.exercise.name}</h3>
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {re.exercise.muscleGroup} {re.exercise.equipment && `• ${re.exercise.equipment}`}
                        </span>
                        {re.exercise.muscleGroup.toLowerCase() !== "cardio" && (
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-1.5 py-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleUpdateSets(re.id, -1, re.sets)}
                              disabled={re.sets <= 1}
                              className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 transition-all font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-1.5 min-w-[62px] text-center select-none font-mono">
                              {re.sets} Series
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateSets(re.id, 1, re.sets)}
                              disabled={re.sets >= 9}
                              className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-20 transition-all font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {re.exercise.muscleGroup.toLowerCase() !== "cardio" && (
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="flex items-center justify-between w-full max-w-sm mt-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                              Definir repeticiones objetivo por serie
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                const isCurrentlyActive = re.repsList !== null && re.repsList !== undefined;
                                const nextActive = !isCurrentlyActive;
                                const newRepsList = nextActive ? Array(re.sets).fill(10).join(",") : null;

                                setRoutine((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    exercises: prev.exercises.map((item) =>
                                      item.id === re.id ? { ...item, repsList: newRepsList } : item
                                    )
                                  };
                                });

                                try {
                                  await fetch(`/api/routines/${id}/exercises/${re.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ repsList: newRepsList }),
                                  });
                                } catch (err) {
                                  console.error("Error updating repsList toggle:", err);
                                }
                              }}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                re.repsList !== null && re.repsList !== undefined
                                  ? "bg-primary"
                                  : "bg-slate-200 dark:bg-slate-800"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  re.repsList !== null && re.repsList !== undefined
                                    ? "translate-x-4"
                                    : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          {re.repsList !== null && re.repsList !== undefined && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 min-w-0">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Objetivos:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {getRepsArray(re).map((repVal, sIdx) => (
                                  <div key={sIdx} className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-lg px-2 py-0.5 border border-slate-200/60 dark:border-slate-800 focus-within:border-primary/50 transition-colors">
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black mr-1.5 uppercase font-mono">S{sIdx + 1}</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="99"
                                      value={repVal}
                                      onChange={async (e) => {
                                        const newVal = Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1));
                                        const currentArray = getRepsArray(re);
                                        currentArray[sIdx] = newVal;
                                        const newRepsList = currentArray.join(",");

                                        setRoutine((prev) => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            exercises: prev.exercises.map((item) =>
                                              item.id === re.id ? { ...item, repsList: newRepsList, reps: currentArray[0] || re.reps } : item
                                            )
                                          };
                                        });

                                        try {
                                          await fetch(`/api/routines/${id}/exercises/${re.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ repsList: newRepsList, reps: currentArray[0] || re.reps }),
                                          });
                                        } catch (err) {
                                          console.error("Error updating reps list:", err);
                                        }
                                      }}
                                      className="w-7 text-center bg-transparent border-0 outline-none text-slate-800 dark:text-slate-200 font-bold text-xs p-0 focus:ring-0 focus:border-transparent font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="hidden sm:flex flex-col gap-0 mr-2">
                    <button onClick={() => handleMoveOrder(index, "up")} disabled={index === 0} className="p-1 text-slate-400 hover:text-primary disabled:opacity-20 transition-colors"><ArrowUp size={16} /></button>
                    <button onClick={() => handleMoveOrder(index, "down")} disabled={index === routine.exercises.length - 1} className="p-1 text-slate-400 hover:text-primary disabled:opacity-20 transition-colors"><ArrowDown size={16} /></button>
                  </div>
                  <button
                    onClick={() => { setReplacingExerciseId(re.id); setStep("picker"); setIsModalOpen(true); }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <RefreshCcw size={15} className="text-primary" />
                    <span>Cambiar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(re.id)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-955/20 hover:bg-red-100 dark:hover:bg-red-955/40 rounded-xl transition-colors border border-red-100 dark:border-red-900/40"
                  >
                    <Trash2 size={15} />
                    <span>Quitar</span>
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
          </div>
        )}

        {/* ── Exercise Picker Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-0 shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {step === "picker" ? "Biblioteca de Ejercicios" : "Configurar Ejercicio"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {step === "picker" ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-6 pb-3 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar ejercicio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      {/* Grupo de Músculo Pills */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grupo Muscular</span>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {["", "Pecho", "Espalda", "Pierna", "Brazo", "Hombro", "Core", "Cardio"].map((muscle) => (
                            <button
                              key={muscle}
                              type="button"
                              onClick={() => setFilterMuscle(muscle)}
                              className={cn(
                                "px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap",
                                filterMuscle === muscle
                                  ? "bg-primary border-primary text-white"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                              )}
                            >
                              {muscle || "Todos"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Equipamiento Pills */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Equipamiento</span>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {["", "Barra", "Mancuernas", "Máquina", "Peso Corporal"].map((eq) => (
                            <button
                              key={eq}
                              type="button"
                              onClick={() => setFilterEquipment(eq)}
                              className={cn(
                                "px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap",
                                filterEquipment === eq
                                  ? "bg-primary border-primary text-white"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                              )}
                            >
                              {eq || "Todos"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 pt-2 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableExercises
                        .filter((ex) => {
                          const normalizeText = (str: string) =>
                            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const matchesSearch = normalizeText(ex.name).includes(normalizeText(searchQuery));
                          const matchesMuscle = filterMuscle ? ex.muscleGroup === filterMuscle : true;
                          const matchesEquipment = filterEquipment ? ex.equipment === filterEquipment : true;
                          return matchesSearch && matchesMuscle && matchesEquipment;
                        })
                        .map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setSelectedExercise(ex.id);
                              setStep("config");
                              setSets(ex.muscleGroup.toLowerCase() === "cardio" ? 1 : 3);
                              setHasTargetReps(true);
                            }}
                            className="group flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary transition-colors text-left shadow-sm"
                          >
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                              {ex.imageUrl ? (
                                <Image src={ex.imageUrl} alt={ex.name} fill className="object-cover" />
                              ) : (
                                getExerciseIcon(ex.equipment, ex.muscleGroup)
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">{ex.name}</h4>
                              <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{ex.muscleGroup} {ex.equipment && `• ${ex.equipment}`}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white dark:bg-slate-900 flex-1 overflow-y-auto">
                  {(() => {
                    const exObj = availableExercises.find((e) => e.id === selectedExercise);
                    if (!exObj) return null;
                    return (
                      <form onSubmit={handleAddExercise} className="space-y-6 max-w-xl mx-auto font-sans">
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-955 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                            {exObj.imageUrl ? (
                              <Image src={exObj.imageUrl} alt={exObj.name} fill className="object-cover" />
                            ) : (
                              getExerciseIcon(exObj.equipment, exObj.muscleGroup)
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{exObj.name}</h4>
                            <p className="text-sm font-semibold text-slate-505 mt-0.5">{exObj.muscleGroup} {exObj.equipment && `• ${exObj.equipment}`}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 space-y-5">
                          {exObj.muscleGroup.toLowerCase() === "cardio" ? (
                            <p className="text-sm font-semibold text-slate-655 dark:text-slate-355">Cardio: 1 sesión de entrenamiento</p>
                          ) : (
                            <div className="space-y-5">
                              <div className="flex items-center justify-between select-none p-1">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  Definir repeticiones objetivo por serie
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setHasTargetReps(!hasTargetReps)}
                                  className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    hasTargetReps ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                      hasTargetReps ? "translate-x-5" : "translate-x-0"
                                    )}
                                  />
                                </button>
                              </div>

                              <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-850 pt-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Series Objetivo</label>
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-sm">
                                  <button
                                    type="button"
                                    disabled={sets <= 1}
                                    onClick={() => setSets((s) => Math.max(1, s - 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950 text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white w-8 text-center select-none font-mono">
                                    {sets}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={sets >= 9}
                                    onClick={() => setSets((s) => Math.min(9, s + 1))}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950 text-slate-600 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {hasTargetReps && (
                                <div className="space-y-2 border-t border-slate-100 dark:border-slate-855 pt-4">
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Repeticiones por Serie</label>
                                  <div className="flex flex-wrap gap-2 pt-1.5">
                                    {Array.from({ length: sets }).map((_, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-1 bg-white/60 dark:bg-slate-900/60 border border-slate-200/65 dark:border-slate-800/85 rounded-xl p-2 shadow-sm min-w-[72px]">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Serie {idx + 1}</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="99"
                                          required
                                          value={repsPerSet[idx] !== undefined ? repsPerSet[idx] : 10}
                                          onChange={(e) => {
                                            const val = Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1));
                                            setRepsPerSet((prev) => {
                                              const next = [...prev];
                                              next[idx] = val;
                                              return next;
                                            });
                                          }}
                                          className="w-12 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-0.5 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
                          <button
                            type="button"
                            onClick={() => setStep("picker")}
                            className="flex-1 sm:flex-none rounded-full px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Volver
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-75"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir a Rutina"}
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
    </DashboardLayout>
  );
}
