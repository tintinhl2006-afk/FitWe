"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Flame, Beef, Wheat, Droplet, Calendar as CalendarIcon, Loader2, Trash2, X, Search, Settings, Target as TargetIcon, Edit3, BarChart3, PieChart, Sparkles, Folder, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";
import AiDietPlanner from "@/components/nutrition/AiDietPlanner";
import SavedDietsModal from "@/components/nutrition/SavedDietsModal";

const FOOD_CATEGORIES = [
  "Todos",
  "Carne",
  "Pescado",
  "Verdura",
  "Fruta",
  "Lácteos",
  "Legumbres",
  "Cereales/Carbohidratos",
  "Grasas/Aceites/Frutos Secos",
  "Otros"
];

interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  category?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  userId: string | null;
}

interface MealEntry {
  id: string;
  mealType: string;
  quantityGrams: number;
  foodItem: FoodItem;
}

const getMealTypesFromConfig = (config: string | null | undefined): { id: string; label: string; isOrphaned?: boolean; }[] => {
  if (!config) {
    return [
      { id: "BREAKFAST", label: "Desayuno" },
      { id: "LUNCH", label: "Almuerzo" },
      { id: "DINNER", label: "Cena" },
      { id: "SNACK-1", label: "Snack 1" },
    ];
  }
  const parts = config.split(",").map(s => s.trim()).filter(Boolean);
  let snackCount = 0;
  return parts.map(id => {
    if (id === "BREAKFAST") return { id, label: "Desayuno" };
    if (id === "LUNCH") return { id, label: "Almuerzo" };
    if (id === "DINNER") return { id, label: "Cena" };
    if (id === "SNACK") return { id, label: "Snack 1" };
    if (id.startsWith("SNACK-")) {
      snackCount++;
      return { id, label: `Snack ${snackCount}` };
    }
    return { id, label: id };
  });
};

export default function NutricionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showConfirm, showAlert } = useCustomAlert();
  
  const [profile, setProfile] = useState<any>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMealType, setModalMealType] = useState<string>("BREAKFAST");
  const [activeTab, setActiveTab] = useState<"mis_alimentos" | "nuevo_alimento" | "editar_alimento">("mis_alimentos");
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isSavedDietsOpen, setIsSavedDietsOpen] = useState(false);
  const searchParams = useSearchParams();
  const generateParam = searchParams.get("generate");

  useEffect(() => {
    if (generateParam === "true") {
      setIsPlannerOpen(true);
      // Clean up the URL parameter to avoid infinite loops on reloads
      const url = new URL(window.location.href);
      url.searchParams.delete("generate");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [generateParam]);
  
  // Search & Foods
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Create Food
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "", brand: "", category: "", calories: "", protein: "", carbs: "", fat: ""
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Todos");

  // Log Meal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityGrams, setQuantityGrams] = useState("");
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Drag & Drop States for Meal Sections Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const mealTypesList = getMealTypesFromConfig(profile?.mealsConfig);

  // Rendered meal sections (includes active config + any orphaned logged meals)
  const renderedMealSections = (() => {
    const sections = [...mealTypesList];
    const activeIds = new Set(mealTypesList.map(m => m.id));
    
    // Find unique mealType in user logged meals that are not in the active configuration
    const orphanedIds = Array.from(new Set(
      meals
        .map(m => m.mealType)
        .filter(id => !activeIds.has(id))
    ));
    
    orphanedIds.forEach(id => {
      let label = "";
      if (id === "BREAKFAST") label = "Desayuno (Inactivo)";
      else if (id === "LUNCH") label = "Almuerzo (Inactivo)";
      else if (id === "DINNER") label = "Cena (Inactivo)";
      else if (id.startsWith("SNACK-")) {
        const num = id.split("-")[1];
        label = `Snack ${num} (Inactivo)`;
      } else {
        label = `${id} (Inactivo)`;
      }
      sections.push({ id, label, isOrphaned: true });
    });
    
    return sections;
  })();

  const saveMealsConfig = async (newConfig: string) => {
    try {
      // Optimización local inmediata en el estado
      setProfile((prev: any) => prev ? { ...prev, mealsConfig: newConfig } : { mealsConfig: newConfig });

      const res = await fetch("/api/user/nutrition-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isManual: true,
          targetCalories: profile?.targetCalories,
          targetProtein: profile?.targetProtein,
          targetCarbs: profile?.targetCarbs,
          targetFat: profile?.targetFat,
          dietType: profile?.dietType,
          allergens: profile?.allergens,
          culinaryStyle: profile?.culinaryStyle,
          excludedFoods: profile?.excludedFoods,
          prioritizedFoods: profile?.prioritizedFoods,
          mealsConfig: newConfig
        })
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la configuración de comidas.");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al actualizar la configuración de comidas");
      if (selectedDate) fetchNutritionData(selectedDate);
    }
  };

  const handleNumMealsChange = async (num: number) => {
    const currentOrder = profile?.mealsConfig
      ? profile.mealsConfig.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

    const coreMeals = ["BREAKFAST", "LUNCH", "DINNER"];
    let newOrder = [...currentOrder];
    
    // Convert generic SNACK to SNACK-1 if it exists
    newOrder = newOrder.map(id => id === "SNACK" ? "SNACK-1" : id);

    const numSnacks = num - 3;
    const activeSnacks = newOrder.filter(id => id.startsWith("SNACK-"));
    const activeSnackNums = activeSnacks.map(id => Number(id.split("-")[1])).filter(n => !isNaN(n));
    const maxSnackNum = activeSnackNums.length > 0 ? Math.max(...activeSnackNums) : 0;

    if (activeSnacks.length < numSnacks) {
      for (let i = maxSnackNum + 1; i <= numSnacks; i++) {
        newOrder.push(`SNACK-${i}`);
      }
    } else if (activeSnacks.length > numSnacks) {
      let count = 0;
      newOrder = newOrder.filter(id => {
        if (id.startsWith("SNACK-")) {
          count++;
          return count <= numSnacks;
        }
        return true;
      });
    }

    coreMeals.forEach(meal => {
      if (!newOrder.includes(meal)) {
        newOrder.push(meal);
      }
    });

    const newConfigStr = newOrder.join(",");
    await saveMealsConfig(newConfigStr);
  };

  const handleMoveMeal = async (index: number, direction: "up" | "down") => {
    const activeOrder = [...mealTypesList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeOrder.length) return;

    const temp = activeOrder[index];
    activeOrder[index] = activeOrder[targetIndex];
    activeOrder[targetIndex] = temp;

    const newConfigStr = activeOrder.map(m => m.id).join(",");
    await saveMealsConfig(newConfigStr);
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For Firefox compatibility
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const sourceSection = renderedMealSections[draggedIndex];
    const targetSection = renderedMealSections[targetIndex];
    if (sourceSection.isOrphaned || targetSection.isOrphaned) return;

    const activeOrder = [...mealTypesList];
    const sourceActiveIndex = activeOrder.findIndex(m => m.id === sourceSection.id);
    const targetActiveIndex = activeOrder.findIndex(m => m.id === targetSection.id);

    if (sourceActiveIndex !== -1 && targetActiveIndex !== -1) {
      const temp = activeOrder[sourceActiveIndex];
      activeOrder[sourceActiveIndex] = activeOrder[targetActiveIndex];
      activeOrder[targetActiveIndex] = temp;

      const newConfigStr = activeOrder.map(m => m.id).join(",");
      await saveMealsConfig(newConfigStr);
    }

    setDraggedIndex(null);
  };

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
      const res = await fetch(`/api/user/nutrition?date=${date}&t=${Date.now()}`, { cache: "no-store" });
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

  const handleEditClick = (food: FoodItem) => {
    setEditingFoodId(food.id);
    setNewFood({
      name: food.name,
      brand: food.brand || "",
      category: food.category || "",
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString()
    });
    setActiveTab("editar_alimento");
  };

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingFood(true);
    try {
      const url = editingFoodId ? `/api/user/foods/${editingFoodId}` : "/api/user/foods";
      const method = editingFoodId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFood),
      });

      if (res.ok) {
        setNewFood({ name: "", brand: "", category: "", calories: "", protein: "", carbs: "", fat: "" });
        setEditingFoodId(null);
        setActiveTab("mis_alimentos");
        fetchFoods();
      } else {
        showAlert("Error al guardar el alimento");
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
      const [year, month, day] = selectedDate.split("-").map(Number);
      const now = session?.user?.serverNow ? new Date(session.user.serverNow) : new Date();
      const entryDate = new Date(Date.UTC(year, month - 1, day, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

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

  const handleDeleteMeal = (id: string) => {
    showConfirm("¿Seguro que quieres borrar este alimento de tu diario?", async () => {
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
    });
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

  const filteredAndSortedFoods = foods
    .filter((food: any) => {
      if (selectedCategoryFilter !== "Todos") {
        return food.category === selectedCategoryFilter;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const catA = a.category || "Otros";
      const catB = b.category || "Otros";
      if (catA !== catB) {
        return catA.localeCompare(catB);
      }
      return a.name.localeCompare(b.name);
    });

  // Desglose por tipo de comida
  const mealBreakdowns = mealTypesList.map((type) => {
    const sectionMeals = meals.filter((m) => m.mealType === type.id);
    const cals = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).cal, 0);
    const pro = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).pro, 0);
    const car = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).car, 0);
    const fat = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).fat, 0);
    return {
      id: type.id,
      label: type.label,
      cals,
      pro,
      car,
      fat,
    };
  });

  // Top 3 alimentos que aportan a cada macro
  const getTopContributors = (macro: "pro" | "car" | "fat") => {
    const contributions = meals.map((m) => {
      const nutrients = calcNutrients(m);
      return {
        name: m.foodItem.name,
        brand: m.foodItem.brand,
        value: nutrients[macro],
      };
    });

    const grouped: { [key: string]: { name: string; brand: string | null; value: number } } = {};
    contributions.forEach((c) => {
      const key = `${c.name}-${c.brand || ""}`;
      if (grouped[key]) {
        grouped[key].value += c.value;
      } else {
        grouped[key] = { name: c.name, brand: c.brand, value: c.value };
      }
    });

    return Object.values(grouped)
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  const topProtein = getTopContributors("pro");
  const topCarbs = getTopContributors("car");
  const topFat = getTopContributors("fat");

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
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-semibold transition-all shadow-sm shadow-cyan-500/10"
              title="Ver desglose y resumen nutricional"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Resumen
            </button>
            <button
              onClick={() => router.push("/nutricion/onboarding?edit=true")}
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold transition-all shadow-sm shadow-yellow-500/20"
              title="Ajustar perfil nutricional"
            >
              <TargetIcon className="w-5 h-5" />
              Establecer Objetivos
            </button>
            <button
              onClick={() => setIsSavedDietsOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Ver mis dietas guardadas y plantillas"
            >
              <Folder className="w-5 h-5 text-slate-400" />
              Mis Dietas
            </button>
            <div className="relative w-full sm:w-auto">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Premium Diet Generator Action Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/25 dark:border-cyan-500/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-soft">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Genera tu dieta automáticamente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Genera al instante un plan completo de 4 comidas diarias ajustado a tu objetivo calórico de <strong className="text-slate-700 dark:text-slate-300">{profile?.targetCalories || 2000} kcal</strong>, teniendo en cuenta tu estilo gastronómico, exclusiones por alérgenos y tipo de dieta.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
            <button
              onClick={() => setIsSavedDietsOpen(true)}
              className="px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              Mis Dietas Guardadas
            </button>
            <button
              onClick={() => setIsPlannerOpen(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/15 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
              Generar Menú Diario
            </button>
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
        {/* Cabecera de Comidas del Día y Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/60">
          <div>
            <h2 className="text-xl font-bold text-slate-850 dark:text-white leading-tight">Comidas del Día</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Desliza/arrastra las comidas para ordenarlas o usa las flechas.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Cantidad de comidas:</span>
            <select
              value={mealTypesList.length}
              onChange={(e) => handleNumMealsChange(Number(e.target.value))}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value={3}>3 comidas (mínimo)</option>
              <option value={4}>4 comidas (+1 Snack)</option>
              <option value={5}>5 comidas (+2 Snacks)</option>
              <option value={6}>6 comidas (+3 Snacks)</option>
              <option value={7}>7 comidas (+4 Snacks)</option>
              <option value={8}>8 comidas (+5 Snacks)</option>
            </select>
          </div>
        </div>

        {/* Secciones de Comida */}
        <div className="space-y-6">
          {renderedMealSections.map((mealType, index) => {
            const sectionMeals = meals.filter(m => m.mealType === mealType.id);
            const sectionCals = sectionMeals.reduce((acc, m) => acc + calcNutrients(m).cal, 0);

            return (
              <div 
                key={mealType.id}
                draggable={!mealType.isOrphaned}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden transition-all duration-200",
                  mealType.isOrphaned 
                    ? "border-red-250 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5" 
                    : "border-slate-200 dark:border-slate-800",
                  draggedIndex === index && "opacity-40 scale-[0.98] border-dashed border-cyan-500",
                  dragOverIndex === index && "border-t-4 border-t-cyan-500 border-dashed"
                )}
              >
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-2.5">
                    {!mealType.isOrphaned && (
                      <div className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors shrink-0 hidden sm:block">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{mealType.label}</h2>
                    {!mealType.isOrphaned && (
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {index > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveMeal(index, "up"); }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Subir"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {index < mealTypesList.length - 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveMeal(index, "down"); }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Bajar"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{Math.round(sectionCals)} kcal</span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {sectionMeals.length > 0 ? (
                    sectionMeals.map(meal => {
                      const { cal, pro, car, fat } = calcNutrients(meal);
                      return (
                        <div key={meal.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <div className="flex items-center gap-4">
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

                {!mealType.isOrphaned && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => openAddFoodModal(mealType.id)}
                      className="w-full py-2.5 rounded-2xl text-primary hover:bg-cyan-50 dark:hover:bg-cyan-950/30 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Añadir Alimento
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Modal Añadir Comida Inteligente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Añadir a {mealTypesList.find(m => m.id === modalMealType)?.label || modalMealType}
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
                onClick={() => {
                  setEditingFoodId(null);
                  setNewFood({ name: "", brand: "", category: "", calories: "", protein: "", carbs: "", fat: "" });
                  setActiveTab("nuevo_alimento");
                }}
                className={cn("flex-1 py-3 text-sm font-semibold transition-colors border-b-2", (activeTab === "nuevo_alimento" || activeTab === "editar_alimento") ? "border-primary text-primary dark:text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              >
                {activeTab === "editar_alimento" ? "Editar Alimento" : "Crear Nuevo"}
              </button>
            </div>

            <div className="overflow-y-auto p-5 custom-scrollbar">
              {activeTab === "mis_alimentos" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <div>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-slate-900 dark:text-white cursor-pointer"
                      >
                        {FOOD_CATEGORIES.map(category => (
                          <option key={category} value={category} className="text-slate-900 dark:text-white bg-white dark:bg-slate-950">
                            {category === "Todos" ? "Todas las categorías" : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isSearching ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
                    ) : filteredAndSortedFoods.length > 0 ? (
                      (() => {
                        let lastCategory = "";
                        return filteredAndSortedFoods.map(food => {
                          const currentCategory = food.category || "Otros";
                          const showHeader = selectedCategoryFilter === "Todos" && currentCategory !== lastCategory;
                          lastCategory = currentCategory;
                          return (
                            <div key={food.id} className="space-y-2">
                              {showHeader && (
                                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-4 pb-1 first:pt-1 flex items-center gap-1.5">
                                  <Folder className="w-3.5 h-3.5" />
                                  <span>{currentCategory}</span>
                                </div>
                              )}
                              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:border-primary/50 dark:hover:border-primary/50 transition-colors bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{food.name}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <span>100g • {food.calories}kcal</span>
                                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[10px] font-medium border border-slate-200/50 dark:border-slate-700/50">
                                        {food.category || "Otros"}
                                      </span>
                                    </p>
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
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {food.userId === session?.user?.id && (
                                      <button 
                                        onClick={() => handleEditClick(food)}
                                        className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors"
                                        title="Editar alimento"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => setSelectedFood(food)}
                                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-medium transition-colors w-full sm:w-auto"
                                    >
                                      Seleccionar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría (Opcional)</label>
                      <select 
                        value={newFood.category} 
                        onChange={e => setNewFood({...newFood, category: e.target.value})} 
                        className="w-full px-3 py-2 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all text-sm"
                      >
                        <option value="">Auto-detectar</option>
                        {FOOD_CATEGORIES.filter(c => c !== "Todos").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
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

      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-2xl">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resumen Nutricional</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSummaryOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-950/10">
              
              {/* COMPARATIVA DE OBJETIVOS VS CONSUMIDO */}
              <div className="space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Objetivos vs Consumido</h3>
                
                <div className="space-y-4">
                  {/* Calorías */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Calorías</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {Math.round(totals.calories)} / {profile?.targetCalories || 0} kcal
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (totals.calories / (profile?.targetCalories || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className={cn(
                      "text-xs font-semibold mt-1",
                      (profile?.targetCalories || 0) - totals.calories > 0 ? "text-slate-500" : "text-rose-500"
                    )}>
                      {(profile?.targetCalories || 0) - totals.calories > 0 
                        ? `Faltan ${Math.round((profile?.targetCalories || 0) - totals.calories)} kcal para el objetivo`
                        : `Te has excedido por ${Math.round(totals.calories - (profile?.targetCalories || 0))} kcal`
                      }
                    </p>
                  </div>

                  {/* Macros Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Proteína */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-805">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-xs font-bold text-slate-500">Proteína</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {Math.round(totals.protein)}/{profile?.targetProtein || 0}g
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (totals.protein / (profile?.targetProtein || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold mt-1",
                        (profile?.targetProtein || 0) - totals.protein > 0 ? "text-slate-400" : "text-rose-500"
                      )}>
                        {(profile?.targetProtein || 0) - totals.protein > 0
                          ? `Faltan ${Math.round((profile?.targetProtein || 0) - totals.protein)}g`
                          : `Excedido por ${Math.round(totals.protein - (profile?.targetProtein || 0))}g`
                        }
                      </p>
                    </div>

                    {/* Carbohidratos */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-805">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-xs font-bold text-slate-500">Carbohidratos</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {Math.round(totals.carbs)}/{profile?.targetCarbs || 0}g
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (totals.carbs / (profile?.targetCarbs || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold mt-1",
                        (profile?.targetCarbs || 0) - totals.carbs > 0 ? "text-slate-400" : "text-rose-500"
                      )}>
                        {(profile?.targetCarbs || 0) - totals.carbs > 0
                          ? `Faltan ${Math.round((profile?.targetCarbs || 0) - totals.carbs)}g`
                          : `Excedido por ${Math.round(totals.carbs - (profile?.targetCarbs || 0))}g`
                        }
                      </p>
                    </div>

                    {/* Grasas */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-805">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-xs font-bold text-slate-500">Grasas</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {Math.round(totals.fat)}/{profile?.targetFat || 0}g
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-yellow-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (totals.fat / (profile?.targetFat || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold mt-1",
                        (profile?.targetFat || 0) - totals.fat > 0 ? "text-slate-400" : "text-rose-500"
                      )}>
                        {(profile?.targetFat || 0) - totals.fat > 0
                          ? `Faltan ${Math.round((profile?.targetFat || 0) - totals.fat)}g`
                          : `Excedido por ${Math.round(totals.fat - (profile?.targetFat || 0))}g`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DISTRIBUCIÓN POR COMIDAS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Desglose por Momentos del Día</h3>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 space-y-3">
                  {mealBreakdowns.map((m) => {
                    const pct = totals.calories > 0 ? Math.round((m.cals / totals.calories) * 100) : 0;
                    return (
                      <div key={m.id} className="pt-3 first:pt-0 flex items-center justify-between">
                        <div className="space-y-1 flex-1 pr-4">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm font-bold text-slate-850 dark:text-slate-200">{m.label}</span>
                            <span className="text-sm font-bold text-slate-950 dark:text-white">
                              {Math.round(m.cals)} kcal <span className="text-xs text-slate-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                          {m.cals > 0 ? (
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span>{Math.round(m.pro)}g P • {Math.round(m.car)}g C • {Math.round(m.fat)}g G</span>
                              <div className="w-24 bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-cyan-500 h-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-0.5">Sin comidas registradas</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FUENTES PRINCIPALES DE NUTRIENTES */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Principales Fuentes de Nutrientes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Proteínas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <div className="w-1.5 h-3 bg-rose-500 rounded-full" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fuentes de Proteína</span>
                    </div>
                    {topProtein.length > 0 ? (
                      <div className="space-y-1.5">
                        {topProtein.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[130px]" title={item.name}>{item.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">{Math.round(item.value)}g</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Sin registros</p>
                    )}
                  </div>

                  {/* Carbohidratos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <div className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fuentes de Carbohidratos</span>
                    </div>
                    {topCarbs.length > 0 ? (
                      <div className="space-y-1.5">
                        {topCarbs.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[130px]" title={item.name}>{item.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">{Math.round(item.value)}g</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Sin registros</p>
                    )}
                  </div>

                  {/* Grasas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <div className="w-1.5 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fuentes de Grasas</span>
                    </div>
                    {topFat.length > 0 ? (
                      <div className="space-y-1.5">
                        {topFat.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[130px]" title={item.name}>{item.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">{Math.round(item.value)}g</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Sin registros</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end bg-slate-50/30 dark:bg-slate-950/20">
              <button 
                onClick={() => setIsSummaryOpen(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary/95 text-white font-semibold rounded-2xl text-sm transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {isPlannerOpen && (
        <AiDietPlanner 
          onClose={() => setIsPlannerOpen(false)}
          onSaved={() => {
            setIsPlannerOpen(false);
            if (selectedDate) fetchNutritionData(selectedDate);
          }}
          initialDate={selectedDate}
        />
      )}

      {isSavedDietsOpen && (
        <SavedDietsModal
          isOpen={isSavedDietsOpen}
          onClose={() => setIsSavedDietsOpen(false)}
          currentDate={selectedDate}
          onApplied={() => {
            if (selectedDate) fetchNutritionData(selectedDate);
          }}
          currentMeals={meals}
        />
      )}
    </DashboardLayout>
  );
}
