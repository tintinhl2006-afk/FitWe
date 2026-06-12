"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  Edit3, 
  Plus, 
  Save, 
  Calendar, 
  Sparkles, 
  Flame, 
  Beef, 
  Wheat, 
  Droplet, 
  Loader2, 
  Search,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STANDARD_FOODS, DietFood } from "@/lib/dietEngine";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface SavedDietItem {
  id?: string;
  foodName: string;
  brand: string | null;
  calories: number; // per 100g
  protein: number;  // per 100g
  carbs: number;    // per 100g
  fat: number;      // per 100g
  quantityGrams: number;
  mealType: string;
}

interface SavedDiet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: SavedDietItem[];
}

interface SavedDietsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onApplied: () => void;
  currentMeals?: any[]; // For saving today's meals as a template
}

const MEAL_TYPES = [
  { id: "BREAKFAST", label: "Desayuno" },
  { id: "LUNCH", label: "Almuerzo" },
  { id: "DINNER", label: "Cena" },
  { id: "SNACK", label: "Snacks" },
];

export default function SavedDietsModal({
  isOpen,
  onClose,
  currentDate,
  onApplied,
  currentMeals = [],
}: SavedDietsModalProps) {
  const { showConfirm, showAlert } = useCustomAlert();

  // General States
  const [diets, setDiets] = useState<SavedDiet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "create_from_current">("list");

  // Edit/Create Form States
  const [selectedDietId, setSelectedDietId] = useState<string | null>(null);
  const [dietName, setDietName] = useState("");
  const [dietItems, setDietItems] = useState<SavedDietItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Search Food States (for editing/creating)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DietFood[]>([]);
  const [selectedSearchFood, setSelectedSearchFood] = useState<DietFood | null>(null);
  const [searchQuantityGrams, setSearchQuantityGrams] = useState("");
  const [searchMealType, setSearchMealType] = useState("BREAKFAST");

  // Load diets list
  const loadDiets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/nutrition/saved-diets");
      if (res.ok) {
        const data = await res.json();
        setDiets(data);
      }
    } catch (e) {
      console.error("Error loading saved diets:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiets();
      setView("list");
    }
  }, [isOpen]);

  // Handle searching foods
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const filtered = STANDARD_FOODS.filter(food => 
        food.name.toLowerCase().includes(q)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  // Calculate totals of a diet
  const calculateDietTotals = (items: SavedDietItem[]) => {
    return items.reduce(
      (acc, item) => {
        const factor = item.quantityGrams / 100;
        return {
          calories: acc.calories + item.calories * factor,
          protein: acc.protein + item.protein * factor,
          carbs: acc.carbs + item.carbs * factor,
          fat: acc.fat + item.fat * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Delete saved diet
  const handleDeleteDiet = (id: string, name: string) => {
    showConfirm(`¿Seguro que deseas eliminar la dieta "${name}"?`, async () => {
      try {
        const res = await fetch(`/api/user/nutrition/saved-diets/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          loadDiets();
        } else {
          showAlert("Error al eliminar la dieta");
        }
      } catch (e) {
        console.error(e);
        showAlert("Error al eliminar la dieta");
      }
    });
  };

  // Apply diet to current date
  const handleApplyDiet = async (id: string, name: string) => {
    showConfirm(`¿Quieres registrar la dieta "${name}" en tu diario para el día ${currentDate}? Se sobrescribirán las comidas de este día.`, async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/user/nutrition/saved-diets/${id}/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: currentDate }),
        });
        if (res.ok) {
          onApplied();
          onClose();
        } else {
          showAlert("Error al aplicar la dieta");
        }
      } catch (e) {
        console.error(e);
        showAlert("Error al aplicar la dieta");
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Open edit diet view
  const handleOpenEdit = (diet: SavedDiet) => {
    setSelectedDietId(diet.id);
    setDietName(diet.name);
    setDietItems([...diet.items]);
    setView("edit");
    setSearchQuery("");
    setSelectedSearchFood(null);
  };

  // Open save current day diet view
  const handleOpenSaveCurrent = () => {
    if (currentMeals.length === 0) {
      showAlert("Tu diario de comidas para hoy está vacío.");
      return;
    }
    setDietName(`Dieta del día ${currentDate}`);
    const mapped = currentMeals.map(meal => ({
      foodName: meal.foodItem.name,
      brand: meal.foodItem.brand,
      calories: meal.foodItem.calories,
      protein: meal.foodItem.protein,
      carbs: meal.foodItem.carbs,
      fat: meal.foodItem.fat,
      quantityGrams: meal.quantityGrams,
      mealType: meal.mealType,
    }));
    setDietItems(mapped);
    setView("create_from_current");
    setSearchQuery("");
    setSelectedSearchFood(null);
  };

  // Add search food item to the list
  const handleAddFoodItem = () => {
    if (!selectedSearchFood || !searchQuantityGrams) return;
    const qty = Number(searchQuantityGrams);
    if (qty <= 0) {
      showAlert("Introduce una cantidad válida");
      return;
    }

    const newItem: SavedDietItem = {
      foodName: selectedSearchFood.name,
      brand: selectedSearchFood.brand || null,
      calories: selectedSearchFood.calories,
      protein: selectedSearchFood.protein,
      carbs: selectedSearchFood.carbs,
      fat: selectedSearchFood.fat,
      quantityGrams: qty,
      mealType: searchMealType,
    };

    setDietItems(prev => [...prev, newItem]);
    setSearchQuery("");
    setSelectedSearchFood(null);
    setSearchQuantityGrams("");
  };

  // Remove food item from the list
  const handleRemoveFoodItem = (idx: number) => {
    setDietItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Save changes
  const handleSaveDiet = async () => {
    if (!dietName.trim()) {
      showAlert("Por favor, ponle un nombre a la dieta");
      return;
    }
    if (dietItems.length === 0) {
      showAlert("La dieta debe contener al menos un alimento");
      return;
    }

    setIsSaving(true);
    try {
      const url = view === "edit" ? `/api/user/nutrition/saved-diets/${selectedDietId}` : "/api/user/nutrition/saved-diets";
      const method = view === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dietName,
          items: dietItems,
        }),
      });

      if (res.ok) {
        setView("list");
        loadDiets();
      } else {
        showAlert("Error al guardar la dieta");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error al guardar la dieta");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-50/40 via-transparent to-blue-50/20 dark:from-slate-950/40 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-cyan-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                {view === "list" ? "Mis Plantillas de Dietas" : view === "edit" ? "Editar Plantilla de Dieta" : "Nueva Plantilla de Dieta"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {view === "list" 
                  ? "Carga, edita o elimina tus planes de alimentación guardados."
                  : "Modifica los alimentos, porciones y el nombre de tu plantilla."}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && view === "list" && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cargando tus plantillas...</p>
          </div>
        )}

        {/* View: List */}
        {!isLoading && view === "list" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
            
            <div className="flex justify-between items-center gap-3">
              <button
                onClick={handleOpenSaveCurrent}
                disabled={currentMeals.length === 0}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Guardar Diario de Hoy como Plantilla
              </button>
              <button
                onClick={() => {
                  setDietName("Nueva Dieta Personalizada");
                  setDietItems([]);
                  setView("create_from_current"); // reusing create logic
                  setSearchQuery("");
                  setSelectedSearchFood(null);
                }}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Dieta Vacía
              </button>
            </div>

            {diets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diets.map(diet => {
                  const totals = calculateDietTotals(diet.items);
                  return (
                    <div 
                      key={diet.id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-950/20 p-5 flex flex-col justify-between hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{diet.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Última modificación: {new Date(diet.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Macros summary inside card */}
                        <div className="grid grid-cols-4 gap-2 bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 p-3 rounded-2xl text-center">
                          <div>
                            <p className="text-[9px] font-bold text-amber-500 uppercase">kcal</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{Math.round(totals.calories)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-rose-500 uppercase">Prot</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{Math.round(totals.protein)}g</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-emerald-500 uppercase">Carb</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{Math.round(totals.carbs)}g</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-yellow-500 uppercase">Gras</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{Math.round(totals.fat)}g</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {diet.items.length} alimentos repartidos en {new Set(diet.items.map(i => i.mealType)).size} momentos del día.
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          onClick={() => handleApplyDiet(diet.id, diet.name)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          Aplicar al Diario
                        </button>
                        <button
                          onClick={() => handleOpenEdit(diet)}
                          className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteDiet(diet.id, diet.name)}
                          className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tienes plantillas de dieta guardadas todavía.
                </p>
                <p className="text-xs text-slate-400">
                  Puedes guardar las comidas de tu diario de hoy como una plantilla o crear una personalizada desde cero.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View: Edit or Create */}
        {!isLoading && (view === "edit" || view === "create_from_current") && (
          <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-6 max-h-[65vh] min-h-0">
            
            {/* Back to list button */}
            <div className="shrink-0">
              <button
                onClick={() => setView("list")}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a la lista de plantillas
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-0">

            {/* Diet Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Nombre de la Plantilla
              </label>
              <input
                type="text"
                value={dietName}
                onChange={e => setDietName(e.target.value)}
                placeholder="Ej. Mi Dieta de Definición"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm font-semibold"
              />
            </div>

            {/* Totals Summary */}
            {dietItems.length > 0 && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl text-center">
                {(() => {
                  const totals = calculateDietTotals(dietItems);
                  return (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Calorías</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(totals.calories)} kcal</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-500 block uppercase">Proteínas</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(totals.protein)}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-500 block uppercase">Carbohidratos</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(totals.carbs)}g</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-yellow-500 block uppercase">Grasas</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(totals.fat)}g</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Add Food to Template Form */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Añadir alimento a la plantilla</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar alimento en catálogo estándar..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white"
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs custom-scrollbar">
                      {searchResults.map(food => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => {
                            setSelectedSearchFood(food);
                            setSearchQuery(food.name);
                            setSearchResults([]);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white flex justify-between items-center"
                        >
                          <span className="font-bold">{food.name}</span>
                          <span className="text-[10px] text-slate-400">{food.calories} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <select
                    value={searchMealType}
                    onChange={e => setSearchMealType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs outline-none text-slate-900 dark:text-white"
                  >
                    {MEAL_TYPES.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSearchFood && (
                <div className="flex items-center gap-3 pt-2 animate-in fade-in duration-200">
                  <div className="flex-1 text-xs">
                    <span className="text-slate-500">Seleccionado:</span> <strong className="text-slate-900 dark:text-white">{selectedSearchFood.name}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Gramos"
                      value={searchQuantityGrams}
                      onChange={e => setSearchQuantityGrams(e.target.value)}
                      className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddFoodItem}
                      disabled={!searchQuantityGrams}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold rounded-2xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Food Items list by Meal Type */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Alimentos en la plantilla
              </label>

              {MEAL_TYPES.map(mealType => {
                const mealTypeItems = dietItems.filter(i => i.mealType === mealType.id);
                return (
                  <div key={mealType.id} className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center text-xs">
                      <strong className="text-slate-800 dark:text-slate-350">{mealType.label}</strong>
                      <span className="text-[10px] text-slate-500">
                        {mealTypeItems.length} alimentos
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {mealTypeItems.length > 0 ? (
                        mealTypeItems.map((item, idx) => {
                          const realIdx = dietItems.findIndex(di => di === item);
                          return (
                            <div key={idx} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {item.foodName} {item.brand && <span className="font-normal text-slate-500 text-[10px] ml-1">({item.brand})</span>}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {item.quantityGrams}g • {Math.round(item.calories * (item.quantityGrams / 100))} kcal
                                </p>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleRemoveFoodItem(realIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-[11px]">
                          No hay alimentos agregados para esta comida.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            </div>

            {/* Bottom Form Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 mt-auto shrink-0">
              <button
                onClick={() => setView("list")}
                className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDiet}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-cyan-500/10 flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Plantilla
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
