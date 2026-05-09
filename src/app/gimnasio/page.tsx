"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Loader2, BicepsFlexed, Activity, Accessibility, Dumbbell, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
}

export default function GimnasioPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    muscleGroup: "Pecho",
  });

  const fetchExercises = async () => {
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (error) {
      console.error("Error al cargar ejercicios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim() || !newExercise.muscleGroup.trim()) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExercise),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear el ejercicio");
      }

      setNewExercise({ name: "", description: "", muscleGroup: "Pecho" });
      setIsCreating(false);
      await fetchExercises();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = filterMuscle ? ex.muscleGroup === filterMuscle : true;
    const matchesEquipment = filterEquipment ? ex.equipment === filterEquipment : true;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const getExerciseIcon = (equipment: string | null, muscleGroup: string) => {
    const lowerGroup = muscleGroup.toLowerCase();
    const lowerEq = equipment?.toLowerCase() || '';

    if (lowerGroup === 'cardio') return <Activity size={24} className="text-blue-400" />;
    if (lowerEq === 'mancuernas') return <Dumbbell size={24} className="text-amber-400" />;
    if (lowerEq === 'peso corporal') return <Accessibility size={24} className="text-green-400" />;
    if (lowerEq === 'barra' || lowerEq === 'máquina' || lowerEq === 'polea') return <Target size={24} className="text-indigo-400" />;
    
    return <BicepsFlexed size={24} className="text-slate-400" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Catálogo de Ejercicios
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Explora y añade ejercicios disponibles en el gimnasio.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ejercicio
          </button>
        </div>

        {isCreating && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Añadir nuevo ejercicio
            </h3>
            <form onSubmit={handleCreateExercise} className="space-y-4">
              {formError && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del ejercicio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Press de banca"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Grupo Muscular
                  </label>
                  <select
                    required
                    value={newExercise.muscleGroup}
                    onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="Pecho">Pecho</option>
                    <option value="Espalda">Espalda</option>
                    <option value="Pierna">Pierna</option>
                    <option value="Brazo">Brazo</option>
                    <option value="Hombro">Hombro</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre la técnica o postura..."
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newExercise.name.trim()}
                  className="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Ejercicio"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value)}
              className="block rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Cualquier Grupo</option>
              <option value="Pecho">Pecho</option>
              <option value="Espalda">Espalda</option>
              <option value="Pierna">Pierna</option>
              <option value="Brazo">Brazo</option>
              <option value="Hombro">Hombro</option>
              <option value="Core">Core</option>
              <option value="Cardio">Cardio</option>
            </select>
            <select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              className="block rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Cualquier Equipo</option>
              <option value="Barra">Barra</option>
              <option value="Mancuernas">Mancuernas</option>
              <option value="Máquina">Máquina</option>
              <option value="Peso Corporal">Peso Corporal</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredExercises.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredExercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/gimnasio/${exercise.id}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 relative">
                  {exercise.imageUrl ? (
                    <Image 
                      src={exercise.imageUrl} 
                      alt={exercise.name} 
                      fill
                      sizes="(max-width: 768px) 56px, 56px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 dark:bg-slate-700 transition-colors group-hover:bg-slate-700 dark:group-hover:bg-slate-600">
                      {getExerciseIcon(exercise.equipment, exercise.muscleGroup)}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {exercise.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {exercise.muscleGroup} {exercise.equipment && `• ${exercise.equipment}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
            <BicepsFlexed className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No se encontraron ejercicios</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {search 
                ? "Prueba con otros términos de búsqueda." 
                : "Usa el botón superior para añadir el primer ejercicio a tu catálogo."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
