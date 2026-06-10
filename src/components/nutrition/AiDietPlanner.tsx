"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  X, 
  ShoppingBag, 
  Utensils, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Flame,
  ChefHat,
  Sliders,
  Settings,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPortionEquivalent, DietFood, MealPlan, SolvedItem, STANDARD_FOODS } from "@/lib/dietEngine";

interface AiDietPlannerProps {
  onClose: () => void;
  onSaved: () => void;
  initialDate?: string;
}

export default function AiDietPlanner({ onClose, onSaved, initialDate }: AiDietPlannerProps) {
  const router = useRouter();

  // Navigation State
  const [showSetup, setShowSetup] = useState(true);
  const [setupStep, setSetupStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"diet" | "grocery">("diet");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Profile & Meal Plan States
  const [profile, setProfile] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [availableFoods, setAvailableFoods] = useState<DietFood[]>([]);
  const [targetDate, setTargetDate] = useState(initialDate || new Date().toISOString().split("T")[0]);

  // Setup Form Preferences
  const [customCalories, setCustomCalories] = useState(2000);
  const [customProteinPct, setCustomProteinPct] = useState(30);
  const [customCarbsPct, setCustomCarbsPct] = useState(40);
  const [customFatPct, setCustomFatPct] = useState(30);
  const [customDietType, setCustomDietType] = useState("STANDARD");
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [customCulinaryStyle, setCustomCulinaryStyle] = useState("CLASSIC");
  
  // Likes & Dislikes (Food Preferences)
  const [prioritizedFoods, setPrioritizedFoods] = useState<string[]>([]);
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);

  // Swap State
  const [swappingItem, setSwappingItem] = useState<{
    mealIndex: number;
    itemIndex: number;
    oldItem: SolvedItem;
  } | null>(null);

  // Custom Food Swap States
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodCalories, setCustomFoodCalories] = useState("");
  const [customFoodProtein, setCustomFoodProtein] = useState("");
  const [customFoodCarbs, setCustomFoodCarbs] = useState("");
  const [customFoodFat, setCustomFoodFat] = useState("");

  // Template States
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (!swappingItem) {
      setShowCustomFoodForm(false);
      setCustomFoodName("");
      setCustomFoodCalories("");
      setCustomFoodProtein("");
      setCustomFoodCarbs("");
      setCustomFoodFat("");
    }
  }, [swappingItem]);

  const handleCreateCustomFood = () => {
    if (!swappingItem) return;
    if (!customFoodName.trim()) {
      alert("Por favor, introduce el nombre del alimento.");
      return;
    }

    const name = customFoodName.trim();
    const cals = Number(customFoodCalories) || 0;
    const pro = Number(customFoodProtein) || 0;
    const carbs = Number(customFoodCarbs) || 0;
    const fat = Number(customFoodFat) || 0;

    if (cals < 0 || pro < 0 || carbs < 0 || fat < 0) {
      alert("Los macros y calorías no pueden ser valores negativos.");
      return;
    }

    const newCustomFood: DietFood = {
      id: `custom-${Date.now()}`,
      name,
      brand: "Personalizado",
      calories: cals,
      protein: pro,
      carbs: carbs,
      fat: fat,
      group: swappingItem.oldItem.food.group,
      isVegan: true,
      isVegetarian: true,
      isKeto: swappingItem.oldItem.food.group !== "CARB",
      allergens: [],
      styles: ["CLASSIC", "MEDITERRANEAN", "QUICK"],
      portionSize: swappingItem.oldItem.food.portionSize,
      portionName: swappingItem.oldItem.food.portionName,
      meals: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
    };

    setAvailableFoods((prev) => [newCustomFood, ...prev]);
    handleSwap(newCustomFood);
  };

  // Checked items in grocery list
  const [checkedGrocery, setCheckedGrocery] = useState<Record<string, boolean>>({});

  // Fetch initial profile
  useEffect(() => {
    const loadInitialProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/user/nutrition-profile");
        if (res.ok) {
          const profileData = await res.json();
          if (profileData) {
            setProfile(profileData);
            
            // Prefill setup form
            const cals = profileData.targetCalories || 2000;
            setCustomCalories(cals);
            
            const pPct = Math.round(((profileData.targetProtein || 150) * 4 / cals) * 100) || 30;
            const fPct = Math.round(((profileData.targetFat || 60) * 9 / cals) * 100) || 30;
            const cPct = 100 - pPct - fPct;
            
            setCustomProteinPct(pPct);
            setCustomCarbsPct(cPct);
            setCustomFatPct(fPct);
            
            setCustomDietType(profileData.dietType || "STANDARD");
            setCustomAllergens(profileData.allergens ? profileData.allergens.split(",").filter(Boolean) : []);
            setCustomCulinaryStyle(profileData.culinaryStyle || "CLASSIC");
          }
        }
      } catch (e) {
        console.error("Error loading nutrition profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialProfile();
  }, []);

  // Compute live macro grams based on calories and percentages
  const liveMacros = {
    protein: Math.round((customCalories * (customProteinPct / 100)) / 4),
    carbs: Math.round((customCalories * (customCarbsPct / 100)) / 4),
    fat: Math.round((customCalories * (customFatPct / 100)) / 9),
  };

  const totalPct = customProteinPct + customCarbsPct + customFatPct;

  // Generate Diet with Custom Query overrides
  const handleGenerateDiet = async () => {
    if (totalPct !== 100) {
      alert(`La distribución de macros debe sumar exactamente 100%. Actualmente suma ${totalPct}%.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams({
        calories: customCalories.toString(),
        protein: liveMacros.protein.toString(),
        carbs: liveMacros.carbs.toString(),
        fat: liveMacros.fat.toString(),
        dietType: customDietType,
        allergens: customAllergens.join(","),
        culinaryStyle: customCulinaryStyle,
        excluded: excludedFoods.join(","),
        prioritized: prioritizedFoods.join(","),
      });

      const res = await fetch(`/api/user/nutrition/generate-diet?${qParams.toString()}`);
      if (!res.ok) {
        throw new Error("No se pudo generar el plan de alimentación personalizado.");
      }
      
      const data = await res.json();
      setMealPlan(data.plan);
      setAvailableFoods(data.availableFoods);
      setShowSetup(false);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error al generar la dieta");
    } finally {
      setIsLoading(false);
    }
  };

  // Swap Food Alternative
  const handleSwap = (newFood: DietFood) => {
    if (!swappingItem) return;
    const { mealIndex, itemIndex, oldItem } = swappingItem;
    
    const group = oldItem.food.group;
    let ratio = 1;
    
    if (group === "CARB" && newFood.carbs > 0 && oldItem.food.carbs > 0) {
      ratio = oldItem.food.carbs / newFood.carbs;
    } else if (group === "PROTEIN" && newFood.protein > 0 && oldItem.food.protein > 0) {
      ratio = oldItem.food.protein / newFood.protein;
    } else if (group === "FAT" && newFood.fat > 0 && oldItem.food.fat > 0) {
      ratio = oldItem.food.fat / newFood.fat;
    } else {
      ratio = oldItem.food.calories / newFood.calories;
    }
    
    const newQty = Math.max(10, Math.round(oldItem.quantityGrams * ratio));
    
    const newSolvedItem: SolvedItem = {
      food: newFood,
      quantityGrams: newQty,
      calories: Math.round((newFood.calories * newQty) / 100),
      protein: Math.round(((newFood.protein * newQty) / 100) * 10) / 10,
      carbs: Math.round(((newFood.carbs * newQty) / 100) * 10) / 10,
      fat: Math.round(((newFood.fat * newQty) / 100) * 10) / 10,
      equivalentText: getPortionEquivalent(newFood, newQty),
    };

    const updatedPlan = [...mealPlan];
    updatedPlan[mealIndex].items[itemIndex] = newSolvedItem;

    // Recalculate meal totals
    let mealCals = 0;
    let mealPro = 0;
    let mealCarbs = 0;
    let mealFat = 0;

    updatedPlan[mealIndex].items.forEach(item => {
      mealCals += item.calories;
      mealPro += item.protein;
      mealCarbs += item.carbs;
      mealFat += item.fat;
    });

    updatedPlan[mealIndex].calories = Math.round(mealCals);
    updatedPlan[mealIndex].protein = Math.round(mealPro * 10) / 10;
    updatedPlan[mealIndex].carbs = Math.round(mealCarbs * 10) / 10;
    updatedPlan[mealIndex].fat = Math.round(mealFat * 10) / 10;

    setMealPlan(updatedPlan);
    setSwappingItem(null);
  };

  // Save/Register diet in Database
  const handleSavePlan = async () => {
    setIsLoading(true);
    try {
      const allItems = mealPlan.flatMap((meal) => 
        meal.items.map((item) => ({
          foodName: item.food.name,
          brand: item.food.brand,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          quantityGrams: item.quantityGrams,
          caloriesPer100g: item.food.calories,
          proteinPer100g: item.food.protein,
          carbsPer100g: item.food.carbs,
          fatPer100g: item.food.fat,
          mealType: meal.mealType,
        }))
      );

      const res = await fetch("/api/user/nutrition/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          items: allItems,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar la dieta en tu diario.");
      }

      onSaved();
    } catch (e: any) {
      setError(e.message || "Error al registrar la dieta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save diet as a named template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert("Por favor, introduce un nombre para la plantilla.");
      return;
    }

    setIsLoading(true);
    try {
      const allItems = mealPlan.flatMap((meal) => 
        meal.items.map((item) => ({
          foodName: item.food.name,
          brand: item.food.brand,
          calories: item.food.calories,
          protein: item.food.protein,
          carbs: item.food.carbs,
          fat: item.food.fat,
          quantityGrams: item.quantityGrams,
          mealType: meal.mealType,
        }))
      );

      const res = await fetch("/api/user/nutrition/saved-diets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          items: allItems,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la plantilla.");
      }

      setIsSavingTemplate(false);
      setTemplateName("");
      alert("¡Plantilla de dieta guardada con éxito!");
    } catch (e: any) {
      setError(e.message || "Error al guardar la plantilla.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle prioritized/excluded food states
  const setFoodPreference = (foodId: string, status: "like" | "dislike" | "neutral") => {
    if (status === "like") {
      setPrioritizedFoods(prev => [...prev.filter(id => id !== foodId), foodId]);
      setExcludedFoods(prev => prev.filter(id => id !== foodId));
    } else if (status === "dislike") {
      setExcludedFoods(prev => [...prev.filter(id => id !== foodId), foodId]);
      setPrioritizedFoods(prev => prev.filter(id => id !== foodId));
    } else {
      setPrioritizedFoods(prev => prev.filter(id => id !== foodId));
      setExcludedFoods(prev => prev.filter(id => id !== foodId));
    }
  };

  const totalMacros = mealPlan.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Group grocery items by aisle
  const getGroceryItems = () => {
    const list: Record<string, { name: string; quantity: number; unit: string; key: string }> = {};

    mealPlan.forEach((meal) => {
      meal.items.forEach((item) => {
        const key = item.food.id;
        if (list[key]) {
          list[key].quantity += item.quantityGrams;
        } else {
          list[key] = {
            name: item.food.name,
            quantity: item.quantityGrams,
            unit: item.food.id.includes("milk") ? "ml" : "g",
            key: item.food.id,
          };
        }
      });
    });

    const aisles: Record<string, typeof list[string][]> = {
      "Proteínas (Carnes, Pescados, Tofu)": [],
      "Lácteos y Alternativas": [],
      "Verduras y Frutas": [],
      "Despensa y Granos": [],
      "Aceites, Frutos Secos y Grasas": [],
      "Suplementación": [],
    };

    Object.values(list).forEach((item) => {
      const id = item.key;
      if (id.includes("chicken") || id.includes("salmon") || id.includes("tuna") || id.includes("tofu")) {
        aisles["Proteínas (Carnes, Pescados, Tofu)"].push(item);
      } else if (id.includes("milk") || id.includes("yogurt") || id.includes("cheese")) {
        aisles["Lácteos y Alternativas"].push(item);
      } else if (id.includes("banana") || id.includes("apple") || id.includes("broccoli") || id.includes("spinach")) {
        aisles["Verduras y Frutas"].push(item);
      } else if (id.includes("oats") || id.includes("rice") || id.includes("bread") || id.includes("pasta")) {
        aisles["Despensa y Granos"].push(item);
      } else if (id.includes("oil") || id.includes("walnuts") || id.includes("peanut") || id.includes("avocado")) {
        aisles["Aceites, Frutos Secos y Grasas"].push(item);
      } else {
        aisles["Suplementación"].push(item);
      }
    });

    return Object.fromEntries(
      Object.entries(aisles).filter(([_, items]) => items.length > 0)
    );
  };

  const groceryAisles = getGroceryItems();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-50/40 via-transparent to-blue-50/20 dark:from-slate-950/40 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                Planificador de Dieta Personalizada
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura tus gustos, macros y alérgenos para generar tu menú del día.
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
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Procesando tus preferencias nutricionales...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
            <div className="bg-red-100 dark:bg-red-500/10 p-3 rounded-full text-red-600">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Error</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <div className="flex gap-2">
              <button 
                onClick={showSetup ? handleGenerateDiet : () => setShowSetup(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Volver a intentar
              </button>
              <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Setup Wizard Progression View */}
        {!isLoading && !error && showSetup && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            
            {/* Beautiful Progressive Step Indicator */}
            <div className="relative mb-6 max-w-md w-full mx-auto px-4">
              {/* Background Line */}
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
              
              {/* Foreground progress Line */}
              <div className="absolute top-5 left-10 right-10 h-0.5 -translate-y-1/2 z-0 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ 
                    width: setupStep === 1 ? "0%" : setupStep === 2 ? "50%" : "100%" 
                  }} 
                />
              </div>
              
              {/* Circles */}
              <div className="relative flex justify-between items-center z-10">
                {[
                  { step: 1, label: "Macros", icon: Sliders },
                  { step: 2, label: "Restricciones", icon: ChefHat },
                  { step: 3, label: "Gustos", icon: Sparkles }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = setupStep === item.step;
                  const isCompleted = setupStep > item.step;
                  
                  return (
                    <div key={item.step} className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                        isActive
                          ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/25 scale-110"
                          : isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400"
                      )}>
                        {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <IconComponent className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold mt-2 whitespace-nowrap",
                        isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 max-w-2xl w-full mx-auto bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 md:p-8 shadow-soft">
              
              {/* STEP 1: Confirm Calories Goal & Macros */}
              {setupStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center justify-center gap-2">
                      <Sliders className="w-5 h-5 text-cyan-500" /> Objetivo Calórico y Macros Configurados
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Confirma que tu objetivo calórico y distribución de macros son correctos para tu plan.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Calories Goal Card */}
                    <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 dark:border-cyan-500/20 rounded-3xl p-6 text-center space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Objetivo Calórico Diario</span>
                      <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
                        {customCalories} <span className="text-lg font-normal text-slate-500">kcal</span>
                      </div>
                    </div>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-3.5">
                      {/* Protein */}
                      <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 rounded-2xl text-center space-y-1">
                        <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Proteínas</p>
                        <p className="text-xl font-black text-rose-950 dark:text-rose-300">{liveMacros.protein}g</p>
                        <p className="text-[10px] font-medium text-slate-500">{customProteinPct}%</p>
                      </div>

                      {/* Carbs */}
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/30 rounded-2xl text-center space-y-1">
                        <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Carbohidratos</p>
                        <p className="text-xl font-black text-amber-950 dark:text-amber-300">{liveMacros.carbs}g</p>
                        <p className="text-[10px] font-medium text-slate-500">{customCarbsPct}%</p>
                      </div>

                      {/* Fat */}
                      <div className="p-4 bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-950/30 rounded-2xl text-center space-y-1">
                        <p className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider">Grasas</p>
                        <p className="text-xl font-black text-sky-950 dark:text-sky-300">{liveMacros.fat}g</p>
                        <p className="text-[10px] font-medium text-slate-500">{customFatPct}%</p>
                      </div>
                    </div>

                    {/* Helper text */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <p>
                        Estos objetivos se usarán para estimar las porciones de alimentos de tu menú diario. Puedes reajustarlos en cualquier momento.
                      </p>
                    </div>

                    {/* Button to edit objectives */}
                    <div className="text-center pt-2">
                      <button 
                        onClick={() => {
                          onClose();
                          router.push("/nutricion/onboarding?edit=true");
                        }}
                        className="inline-flex items-center gap-2 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold hover:underline"
                      >
                        <Wand2 className="w-4 h-4 text-cyan-500" />
                        ¿Quieres cambiar tus macros o calorías? Ajusta tus objetivos
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 2: Restrictions & Culinary Styles */}
              {setupStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center justify-center gap-2">
                      <ChefHat className="w-5 h-5 text-violet-500" /> Tipo de Dieta y Restricciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Adaptamos las recetas a tus hábitos diarios y exclusiones médicas.</p>
                  </div>

                  <div className="space-y-5">
                    
                    {/* Diet Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de Dieta</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { id: "STANDARD", label: "Estándar", desc: "Todo tipo de alimentos" },
                          { id: "VEGETARIAN", label: "Vegetariana", desc: "Sin carnes ni pescados" },
                          { id: "VEGAN", label: "Vegana", desc: "100% de origen vegetal" },
                          { id: "KETO", label: "Keto / Cetogénico", desc: "Bajo en carbohidratos" },
                        ].map((diet) => (
                          <button
                            key={diet.id}
                            type="button"
                            onClick={() => setCustomDietType(diet.id)}
                            className={cn(
                              "p-3.5 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-20 bg-white dark:bg-slate-900/60",
                              customDietType === diet.id
                                ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                                : "border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-850"
                            )}
                          >
                            <span className="font-bold text-slate-900 dark:text-white">{diet.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{diet.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Culinary Style */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estilo Gastronómico</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { id: "CLASSIC", label: "Fitness Clásico", desc: "Arroz, pollo, claras..." },
                          { id: "MEDITERRANEAN", label: "Mediterráneo", desc: "Salud y variedad" },
                          { id: "QUICK", label: "Fácil/Rápido", desc: "Poco tiempo/prep" },
                        ].map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setCustomCulinaryStyle(style.id)}
                            className={cn(
                              "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-24 bg-white dark:bg-slate-900/60",
                              customCulinaryStyle === style.id
                                ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                                : "border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-850"
                            )}
                          >
                            <span className="font-bold text-slate-900 dark:text-white leading-tight">{style.label}</span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-1">{style.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Allergens exclusions */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Restricciones / Alérgenos</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "GLUTEN", label: "Gluten" },
                          { id: "LACTOSE", label: "Lactosa" },
                          { id: "NUTS", label: "Frutos Secos" },
                          { id: "EGG", label: "Huevo" },
                          { id: "FISH", label: "Pescado" },
                        ].map(allergen => {
                          const isSelected = customAllergens.includes(allergen.id);
                          return (
                            <button
                              key={allergen.id}
                              type="button"
                              onClick={() => {
                                setCustomAllergens(prev => 
                                  isSelected ? prev.filter(a => a !== allergen.id) : [...prev, allergen.id]
                                );
                              }}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                                isSelected 
                                  ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20" 
                                  : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                              )}
                            >
                              {allergen.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 3: Likes & Dislikes catalog checklist */}
              {setupStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col max-h-[500px]">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" /> Preferencias y Gustos de Alimentos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Marca lo que te encanta para priorizarlo y lo que no te gusta para excluirlo.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[320px] custom-scrollbar">
                    {STANDARD_FOODS
                      .filter(food => {
                        if (customDietType === "VEGAN" && !food.isVegan) return false;
                        if (customDietType === "VEGETARIAN" && !food.isVegetarian) return false;
                        if (customDietType === "KETO" && !food.isKeto && food.group === "CARB") return false;
                        return !food.allergens.some(a => customAllergens.includes(a));
                      })
                      .map(food => {
                        const isPrioritized = prioritizedFoods.includes(food.id);
                        const isExcluded = excludedFoods.includes(food.id);
                        
                        return (
                          <div key={food.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{food.name}</p>
                              <p className="text-[11px] text-slate-455 dark:text-slate-400">{food.group} • {food.calories} kcal/100g</p>
                            </div>
                            
                            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setFoodPreference(food.id, "like")}
                                className={cn(
                                  "p-1.5 rounded-lg text-xs font-bold transition-all",
                                  isPrioritized 
                                    ? "bg-emerald-500 text-white shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                                title="Priorizar"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFoodPreference(food.id, "neutral")}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                  !isPrioritized && !isExcluded 
                                    ? "bg-slate-600 text-white dark:bg-slate-700 shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                              >
                                Neutral
                              </button>
                              <button
                                type="button"
                                onClick={() => setFoodPreference(food.id, "dislike")}
                                className={cn(
                                  "p-1.5 rounded-lg text-xs font-bold transition-all",
                                  isExcluded 
                                    ? "bg-red-500 text-white shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                                title="Excluir"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Wizard Footer Navigation */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 mt-auto">
              {setupStep === 1 ? (
                <button 
                  onClick={onClose} 
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  onClick={() => setSetupStep(s => Math.max(1, s - 1))}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}

              {setupStep < 3 ? (
                <button
                  onClick={() => {
                    if (setupStep === 1 && totalPct !== 100) {
                      alert(`Los macros deben sumar exactamente 100% (actualmente ${totalPct}%)`);
                      return;
                    }
                    setSetupStep(s => Math.min(3, s + 1));
                  }}
                  disabled={setupStep === 1 && totalPct !== 100}
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 flex items-center gap-1.5"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGenerateDiet}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-cyan-500/10 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Generar mi Dieta Personalizada
                </button>
              )}
            </div>

          </div>
        )}

        {/* Plan Display View */}
        {!isLoading && !error && !showSetup && (
          <>
            {/* Meta Bar */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span>Fecha del Registro:</span>
                <input 
                  type="date" 
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-slate-800 dark:text-slate-200 focus:border-cyan-500"
                />
              </div>

              {/* Tabs */}
              <div className="flex p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveTab("diet")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    activeTab === "diet" 
                      ? "bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Menú Diario
                </button>
                <button
                  onClick={() => setActiveTab("grocery")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                    activeTab === "grocery" 
                      ? "bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Lista de la Compra
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {activeTab === "diet" ? (
                <>
                  {/* Macro Balance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Calorías Totales</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {totalMacros.calories} <span className="text-xs font-normal text-slate-500">/ {customCalories} kcal</span>
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (totalMacros.calories / customCalories) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Proteínas</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(totalMacros.protein)}g <span className="text-xs font-normal text-slate-500">/ {liveMacros.protein}g</span>
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (totalMacros.protein / liveMacros.protein) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Carbohidratos</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(totalMacros.carbs)}g <span className="text-xs font-normal text-slate-500">/ {liveMacros.carbs}g</span>
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (totalMacros.carbs / liveMacros.carbs) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-sky-500 uppercase tracking-wider">Grasas</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(totalMacros.fat)}g <span className="text-xs font-normal text-slate-500">/ {liveMacros.fat}g</span>
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (totalMacros.fat / liveMacros.fat) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meals List */}
                  <div className="space-y-4">
                    {mealPlan.map((meal, mIdx) => (
                      <div 
                        key={meal.mealType}
                        className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-sm"
                      >
                        {/* Meal Header */}
                        <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                            {meal.mealLabel}
                          </h3>
                          <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>🔥 {meal.calories} kcal</span>
                            <span className="text-rose-500">P: {Math.round(meal.protein)}g</span>
                            <span className="text-amber-500">C: {Math.round(meal.carbs)}g</span>
                            <span className="text-sky-500">G: {Math.round(meal.fat)}g</span>
                          </div>
                        </div>

                        {/* Meal Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {meal.items.map((item, iIdx) => (
                            <div 
                              key={`${item.food.id}-${iIdx}`}
                              className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group/item hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{item.food.name}</span>
                                  {item.food.brand && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                                      {item.food.brand}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
                                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.quantityGrams}g</span>
                                  <span className="text-slate-300 dark:text-slate-700">|</span>
                                  <span>{item.equivalentText}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-5 justify-between md:justify-end">
                                {/* Item Macros */}
                                <div className="flex gap-3 text-[11px] font-semibold text-slate-400">
                                  <span>🔥 {item.calories} kcal</span>
                                  <span className="text-rose-500/80">P: {item.protein}g</span>
                                  <span className="text-amber-500/80">C: {item.carbs}g</span>
                                  <span className="text-sky-500/80">G: {item.fat}g</span>
                                </div>

                                {/* Swap trigger */}
                                <button
                                  onClick={() => setSwappingItem({
                                    mealIndex: mIdx,
                                    itemIndex: iIdx,
                                    oldItem: item,
                                  })}
                                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 bg-white dark:bg-slate-900 shadow-soft transition-all flex items-center gap-1.5 text-xs font-bold opacity-90 group-hover/item:opacity-100 group-hover/item:scale-105"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 animate-hover-spin" />
                                  Cambiar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Grocery List Tab */
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-cyan-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tu lista inteligente está lista</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hemos sumado las cantidades de la dieta y las hemos agrupado por pasillos del supermercado para facilitarte la compra.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groceryAisles).map(([aisle, items]) => (
                      <div 
                        key={aisle}
                        className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3.5"
                      >
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                          <span>🛒 {aisle}</span>
                          <span className="text-xs bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-semibold">
                            {items.length} {items.length === 1 ? "artículo" : "artículos"}
                          </span>
                        </h4>

                        <div className="space-y-2.5">
                          {items.map((item) => {
                            const isChecked = !!checkedGrocery[item.key];
                            return (
                              <div 
                                key={item.key}
                                onClick={() => setCheckedGrocery(prev => ({ ...prev, [item.key]: !isChecked }))}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all",
                                  isChecked 
                                    ? "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-60" 
                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-800"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  isChecked 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "border-slate-300 dark:border-slate-700"
                                )}>
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div className="flex-1 flex justify-between items-center text-sm">
                                  <span className={cn(
                                    "font-semibold",
                                    isChecked ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"
                                  )}>
                                    {item.name}
                                  </span>
                                  <span className="font-bold text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg">
                                    {item.quantity}{item.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {isSavingTemplate ? (
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Nombre de la plantilla (ej. Dieta de Lunes)"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-cyan-500"
                    autoFocus
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsSavingTemplate(false)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAsTemplate}
                      className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Guardar Plantilla
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSetupStep(1);
                      setShowSetup(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Ajustar Gustos / Volver
                  </button>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setIsSavingTemplate(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-550" />
                      Guardar como Plantilla
                    </button>
                    <button
                      onClick={handleSavePlan}
                      className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Registrar en el Diario
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

      </div>

      {/* Client-Side Smart Swap Modal */}
      {swappingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-500" />
                Intercambiar Alimento
              </h3>
              <button 
                onClick={() => setSwappingItem(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccionando un equivalente para: <strong className="text-slate-700 dark:text-slate-300">{swappingItem.oldItem.food.name}</strong> ({swappingItem.oldItem.quantityGrams}g)
              </p>
            </div>

            {showCustomFoodForm ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 animate-in fade-in duration-200">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>El nuevo alimento se creará automáticamente como fuente de <strong>{swappingItem.oldItem.food.group === "CARB" ? "Carbohidratos" : swappingItem.oldItem.food.group === "PROTEIN" ? "Proteínas" : "Grasas"}</strong> para garantizar la conversión correcta.</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nombre del Alimento</label>
                    <input 
                      type="text"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Calorías (por 100g)</label>
                      <input 
                        type="number"
                        value={customFoodCalories}
                        onChange={(e) => setCustomFoodCalories(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Proteínas (por 100g)</label>
                      <input 
                        type="number"
                        value={customFoodProtein}
                        onChange={(e) => setCustomFoodProtein(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Carbohidratos (por 100g)</label>
                      <input 
                        type="number"
                        value={customFoodCarbs}
                        onChange={(e) => setCustomFoodCarbs(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Grasas (por 100g)</label>
                      <input 
                        type="number"
                        value={customFoodFat}
                        onChange={(e) => setCustomFoodFat(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => setShowCustomFoodForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-955 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateCustomFood}
                    className="flex-[2] py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
                  >
                    Crear e Intercambiar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="py-2 flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 mb-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alternativas equivalentes</span>
                  <button
                    onClick={() => setShowCustomFoodForm(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear alternativa propia
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(() => {
                    const currentMealType = mealPlan[swappingItem.mealIndex].mealType;
                    let alts = availableFoods.filter(
                      food => 
                        food.group === swappingItem.oldItem.food.group && 
                        food.id !== swappingItem.oldItem.food.id &&
                        food.meals && 
                        food.meals.includes(currentMealType as any)
                    );
                    
                    if (alts.length === 0) {
                      alts = availableFoods.filter(
                        food => 
                          food.group === swappingItem.oldItem.food.group && 
                          food.id !== swappingItem.oldItem.food.id
                      );
                    }

                    return alts.map(altFood => {
                      const oldItem = swappingItem.oldItem;
                      const group = oldItem.food.group;
                      let ratio = 1;
                      
                      if (group === "CARB" && altFood.carbs > 0 && oldItem.food.carbs > 0) {
                        ratio = oldItem.food.carbs / altFood.carbs;
                      } else if (group === "PROTEIN" && altFood.protein > 0 && oldItem.food.protein > 0) {
                        ratio = oldItem.food.protein / altFood.protein;
                      } else if (group === "FAT" && altFood.fat > 0 && oldItem.food.fat > 0) {
                        ratio = oldItem.food.fat / altFood.fat;
                      } else {
                        ratio = oldItem.food.calories / altFood.calories;
                      }

                      const altQty = Math.max(10, Math.round(oldItem.quantityGrams * ratio));
                      const altPortionText = getPortionEquivalent(altFood, altQty);

                      return (
                        <div 
                          key={altFood.id}
                          onClick={() => handleSwap(altFood)}
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex justify-between items-center group"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 text-sm">
                              {altFood.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{altQty}g</span>
                              <span>({altPortionText})</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Porción Equivalente</div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              P: {altFood.protein}g | C: {altFood.carbs}g | G: {altFood.fat}g
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {availableFoods.filter(food => food.group === swappingItem.oldItem.food.group && food.id !== swappingItem.oldItem.food.id).length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No se encontraron alimentos equivalentes aptos para tus exclusiones y tipo de dieta.
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSwappingItem(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-750 dark:text-slate-350 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
