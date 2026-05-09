"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Flame, Beef, Wheat, Droplet, Calendar as CalendarIcon, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

export default function NutricionPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const fetchNutritionData = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/nutrition?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error al cargar nutrición:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData(selectedDate);
  }, [selectedDate]);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name) return;

    setIsSubmitting(true);
    try {
      const entryDate = new Date(selectedDate);
      const now = new Date();
      entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFood,
          date: entryDate.toISOString(),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewFood({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
        await fetchNutritionData(selectedDate);
      }
    } catch (error) {
      console.error("Error al añadir comida:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este alimento?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/nutrition/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchNutritionData(selectedDate);
      }
    } catch (error) {
      console.error("Error al borrar comida:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Diario de Nutrición
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Registra tus comidas y controla tus macronutrientes.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Añadir Comida
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400">
                <Flame className="h-5 w-5" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Calorías</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totals.calories} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">kcal</span></p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400">
                <Beef className="h-5 w-5" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Proteínas</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totals.protein.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">g</span></p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400">
                <Wheat className="h-5 w-5" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Carbohidratos</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totals.carbs.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">g</span></p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500 dark:text-yellow-400">
                <Droplet className="h-5 w-5" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Grasas</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totals.fat.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">g</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Alimentos consumidos hoy</h3>
          </div>
          
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : entries.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry) => (
                <li key={entry.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{entry.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(entry.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="text-center px-3">
                        <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1">Kcal</span>
                        <span className="text-slate-900 dark:text-white">{entry.calories}</span>
                      </div>
                      <div className="text-center px-3 border-l border-slate-200 dark:border-slate-800">
                        <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1">Pro</span>
                        <span className="text-blue-600 dark:text-blue-400">{entry.protein}g</span>
                      </div>
                      <div className="text-center px-3 border-l border-slate-200 dark:border-slate-800">
                        <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1">Car</span>
                        <span className="text-amber-600 dark:text-amber-400">{entry.carbs}g</span>
                      </div>
                      <div className="text-center px-3 border-l border-slate-200 dark:border-slate-800">
                        <span className="block text-slate-400 dark:text-slate-500 text-xs uppercase mb-1">Gra</span>
                        <span className="text-yellow-600 dark:text-yellow-400">{entry.fat}g</span>
                      </div>
                      <button
                        onClick={() => handleDeleteFood(entry.id)}
                        disabled={deletingId === entry.id}
                        className="ml-2 p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === entry.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                <Flame className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sin registros</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                No has añadido ningún alimento para esta fecha. Comienza pulsando el botón superior.
              </p>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Alimento</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddFood} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alimento / Comida
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pechuga de pollo"
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Calorías (kcal)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newFood.calories || ""}
                      onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Proteínas (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={newFood.protein || ""}
                      onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Carbohidratos (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={newFood.carbs || ""}
                      onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })}
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Grasas (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={newFood.fat || ""}
                      onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })}
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newFood.name}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 transition-colors"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir Alimento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
