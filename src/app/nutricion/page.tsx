"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Flame, Beef, Wheat, Droplet, Calendar as CalendarIcon, Loader2, Trash2, X, Search, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealEntry {
  id: string;
  mealType: string;
  quantityGrams: number;
  foodItem: FoodItem;
}

const MEAL_TYPES = [
  { id: "BREAKFAST", label: "Desayuno" },
  { id: "LUNCH", label: "Almuerzo" },
  { id: "DINNER", label: "Cena" },
  { id: "SNACK", label: "Snacks" },
];

export default function NutricionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [profile, setProfile] = useState<any>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMealType, setModalMealType] = useState<string>("BREAKFAST");
  const [activeTab, setActiveTab] = useState<"mis_alimentos" | "nuevo_alimento">("mis_alimentos");
  
  // Search & Foods
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Create Food
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "", brand: "", imageUrl: "", calories: "", protein: "", carbs: "", fat: ""
  });

  // Log Meal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityGrams, setQuantityGrams] = useState("");
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Initialize date when session is ready
  useEffect(() => {
    if (session?.user?.serverNow && !selectedDate) {
      setSelectedDate(new Date(session.user.serverNow).toISOString().split("T")[0]);
    } else if (!selectedDate) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  }, [session, selectedDate]);

  const fetchNutritionData = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/nutrition?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.profile) {
          router.push("/nutricion/onboarding");
          return;
        }
        setProfile(data.profile);
        setMeals(data.meals);
      }
    } catch (error) {
      console.error("Error al cargar nutrición:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchNutritionData(selectedDate);
  }, [selectedDate]);

  const fetchFoods = async (query: string = "") => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/user/foods?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch (error) {
      console.error("Error fetching foods", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch foods when modal opens or search changes
  useEffect(() => {
    if (isModalOpen && activeTab === "mis_alimentos") {
      const delayFn = setTimeout(() => {
        fetchFoods(searchQuery);
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [searchQuery, isModalOpen, activeTab]);

  const openAddFoodModal = (mealType: string) => {
    setModalMealType(mealType);
    setIsModalOpen(true);
    setActiveTab("mis_alimentos");
    setSelectedFood(null);
    setQuantityGrams("");
    setSearchQuery("");
  };

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingFood(true);
    try {
      const res = await fetch("/api/user/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFood),
      });

      if (res.ok) {
        setNewFood({ name: "", brand: "", imageUrl: "", calories: "", protein: "", carbs: "", fat: "" });
        setActiveTab("mis_alimentos");
        fetchFoods();
      } else {
        alert("Error al crear alimento");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingFood(false);
    }
  };

  const handleLogMeal = async () => {
    if (!selectedFood || !quantityGrams) return;
    setIsLoggingMeal(true);
    try {
      const entryDate = new Date(selectedDate);
      const now = session?.user?.serverNow ? new Date(session.user.serverNow) : new Date();
      entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const res = await fetch("/api/user/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodItemId: selectedFood.id,
          mealType: modalMealType,
          quantityGrams: Number(quantityGrams),
          date: entryDate.toISOString(),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNutritionData(selectedDate);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingMeal(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este alimento de tu diario?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/meals/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNutritionData(selectedDate);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  // Calcular consumos
  const calcNutrients = (meal: MealEntry) => {
    const factor = meal.quantityGrams / 100;
    return {
      cal: meal.foodItem.calories * factor,
      pro: meal.foodItem.protein * factor,
      car: meal.foodItem.carbs * factor,
      fat: meal.foodItem.fat * factor,
    };
  };

  const totals = meals.reduce(
    (acc, meal) => {
      const { cal, pro, car, fat } = calcNutrients(meal);
      return {
        calories: acc.calories + cal,
        protein: acc.protein + pro,
        carbs: acc.carbs + car,
        fat: acc.fat + fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Diario de Nutrición
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Registra tus comidas y controla tus macros con exactitud.
            </p>
          </div>
          
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Tarjetas de Macros Totales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-2xl">
                <Flame className="h-5 w-5 text-amber-500" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Calorías</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(totals.calories)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">/ {profile?.targetCalories || 0} kcal</span>
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
                <Beef className="h-5 w-5 text-rose-500" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Proteínas</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(totals.protein)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">/ {profile?.targetProtein || 0} g</span>
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                <Wheat className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Carbohidratos</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(totals.carbs)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">/ {profile?.targetCarbs || 0} g</span>
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl">
                <Droplet className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">Grasas</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(totals.fat)} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">/ {profile?.targetFat || 0} g</span>
            </p>
          </div>
        </div>

        {/* Secciones de Comida */}
        <div className="space-y-6">
          {MEAL_TYPES.map((mealType) => {
            const sectionMeals = meals.filter(m => m.mealType === mealType.id);
            const sectionCals = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).cal, 0);

            return (
              <div key={mealType.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{mealType.label}</h2>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{Math.round(sectionCals)} kcal</span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {sectionMeals.length > 0 ? (
                    sectionMeals.map(meal => {
                      const { cal, pro, car, fat } = calcNutrients(meal);
                      return (
                        <div key={meal.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              {meal.foodItem.imageUrl ? (
                                <img src={meal.foodItem.imageUrl} alt={meal.foodItem.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-sm md:text-base">
                                {meal.foodItem.name} {meal.foodItem.brand && <span className="text-slate-500 font-normal text-xs ml-1">({meal.foodItem.brand})</span>}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {meal.quantityGrams}g • {Math.round(pro)}g P • {Math.round(car)}g C • {Math.round(fat)}g G
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-slate-900 dark:text-white">{Math.round(cal)}</p>
                              <p className="text-xs text-slate-500">kcal</p>
                            </div>
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              disabled={deletingId === meal.id}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors disabled:opacity-50"
                              title="Borrar alimento"
                            >
                              {deletingId === meal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No has registrado alimentos aún.
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => openAddFoodModal(mealType.id)}
                    className="w-full py-2.5 rounded-2xl text-primary hover:bg-cyan-50 dark:hover:bg-cyan-950/30 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Añadir Alimento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Añadir Comida Inteligente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Añadir a {MEAL_TYPES.find(m => m.id === modalMealType)?.label}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => setActiveTab("mis_alimentos")}
                className={cn("flex-1 py-3 text-sm font-semibold transition-colors border-b-2", activeTab === "mis_alimentos" ? "border-primary text-primary dark:text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                Mis Alimentos
              </button>
              <button
                onClick={() => setActiveTab("nuevo_alimento")}
                className={cn("flex-1 py-3 text-sm font-semibold transition-colors border-b-2", activeTab === "nuevo_alimento" ? "border-primary text-primary dark:text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                Crear Nuevo
              </button>
            </div>

            <div className="overflow-y-auto p-5 custom-scrollbar">
              {activeTab === "mis_alimentos" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar alimento..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    {isSearching ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
                    ) : foods.length > 0 ? (
                      foods.map(food => (
                        <div key={food.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:border-primary/50 dark:hover:border-primary/50 transition-colors bg-white dark:bg-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                              {food.imageUrl ? <img src={food.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{food.name}</p>
                              <p className="text-xs text-slate-500">100g • {food.calories}kcal</p>
                            </div>
                          </div>
                          
                          {selectedFood?.id === food.id ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input 
                                type="number" 
                                min="1"
                                placeholder="Gramos" 
                                autoFocus
                                value={quantityGrams}
                                onChange={(e) => setQuantityGrams(e.target.value)}
                                className="w-20 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                              />
                              <button 
                                onClick={handleLogMeal}
                                disabled={isLoggingMeal || !quantityGrams}
                                className="px-3 py-1.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-2xl text-sm font-semibold transition-colors"
                              >
                                {isLoggingMeal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setSelectedFood(food)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-medium transition-colors w-full sm:w-auto"
                            >
                              Seleccionar
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">No se encontraron alimentos.</p>
                        <button onClick={() => setActiveTab("nuevo_alimento")} className="text-primary font-medium text-sm mt-2 hover:underline">Crear uno nuevo</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateFood} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Alimento *</label>
                    <input required type="text" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Marca (Opcional)</label>
                      <input type="text" value={newFood.brand} onChange={e => setNewFood({...newFood, brand: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">URL Imagen (Opcional)</label>
                      <input type="url" value={newFood.imageUrl} onChange={e => setNewFood({...newFood, imageUrl: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" placeholder="https://..." />
                    </div>
                  </div>
                  
                  <div className="pt-2 pb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Información Nutricional (por 100g)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calorías (kcal) *</label>
                      <input required type="number" step="0.1" min="0" value={newFood.calories} onChange={e => setNewFood({...newFood, calories: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Proteínas (g) *</label>
                      <input required type="number" step="0.1" min="0" value={newFood.protein} onChange={e => setNewFood({...newFood, protein: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Carbohidratos (g) *</label>
                      <input required type="number" step="0.1" min="0" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Grasas (g) *</label>
                      <input required type="number" step="0.1" min="0" value={newFood.fat} onChange={e => setNewFood({...newFood, fat: e.target.value})} className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isCreatingFood}
                      className="w-full py-3 bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary text-white rounded-3xl font-bold transition-all shadow-soft disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {isCreatingFood ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar en mi Catálogo"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
