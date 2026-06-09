"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Loader2, 
  ArrowRight, 
  Activity, 
  Target as TargetIcon, 
  Scale, 
  User, 
  CheckCircle2, 
  ArrowLeft, 
  Wand2,
  ChefHat,
  ShieldAlert,
  Sparkles,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/PreferencesContext";

export default function NutritionOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { weightUnit, measurementUnit } = usePreferences();
  const isEditing = searchParams.get("edit") === "true";
  
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    weight: "",
    height: "",
    activityLevel: "",
    goal: "",
    aggressiveness: "",
    dietType: "STANDARD",
    allergens: [] as string[],
    culinaryStyle: "CLASSIC",
  });

  const [manualTargets, setManualTargets] = useState({
    calories: 2000,
    proteinPct: 30,
    carbsPct: 40,
    fatPct: 30,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/nutrition-profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile) {
            setFormData({
              gender: profile.gender || "",
              age: profile.age?.toString() || "",
              weight: profile.weight?.toString() || "",
              height: profile.height?.toString() || "",
              activityLevel: profile.activityLevel || "",
              goal: profile.goal || "",
              aggressiveness: profile.aggressiveness || "",
              dietType: profile.dietType || "STANDARD",
              allergens: profile.allergens ? profile.allergens.split(",").filter(Boolean) : [],
              culinaryStyle: profile.culinaryStyle || "CLASSIC",
            });

            if (profile.targetCalories) {
              const cal = profile.targetCalories;
              const pPct = Math.round((profile.targetProtein * 4 / cal) * 100) || 30;
              const fPct = Math.round((profile.targetFat * 9 / cal) * 100) || 30;
              const cPct = 100 - pPct - fPct;

              setManualTargets({
                calories: cal,
                proteinPct: pPct,
                carbsPct: cPct,
                fatPct: fPct,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [isEditing]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleManualInput = (macro: "proteinPct" | "carbsPct" | "fatPct", value: number) => {
    setManualTargets(prev => ({ ...prev, [macro]: value }));
  };

  const calculateGrams = () => {
    return {
      protein: Math.round((manualTargets.calories * (manualTargets.proteinPct / 100)) / 4),
      carbs: Math.round((manualTargets.calories * (manualTargets.carbsPct / 100)) / 4),
      fat: Math.round((manualTargets.calories * (manualTargets.fatPct / 100)) / 9),
    };
  };

  const handleManualSubmit = async () => {
    const totalPct = manualTargets.proteinPct + manualTargets.carbsPct + manualTargets.fatPct;
    if (totalPct !== 100) {
      alert(`Los porcentajes deben sumar 100%. Actualmente suman ${totalPct}%`);
      return;
    }

    setIsSubmitting(true);
    try {
      const grams = calculateGrams();
      const res = await fetch("/api/user/nutrition-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isManual: true,
          targetCalories: manualTargets.calories,
          targetProtein: grams.protein,
          targetCarbs: grams.carbs,
          targetFat: grams.fat,
          ...formData,
          allergens: formData.allergens.join(","),
        }),
      });

      if (res.ok) {
        const profile = await res.json();
        setSavedProfile(profile);
        setIsSuccessView(true);
      } else {
        alert("Error al guardar el perfil");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWizardSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user/nutrition-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          allergens: formData.allergens.join(","),
        }),
      });

      if (res.ok) {
        const profile = await res.json();
        setSavedProfile(profile);
        setIsSuccessView(true);
      } else {
        alert("Error al guardar el perfil");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.gender && formData.age && formData.weight && formData.height;
      case 2: return formData.activityLevel;
      case 3: return formData.goal;
      case 4: return formData.goal === "MAINTAIN" ? true : formData.aggressiveness;
      case 5: return true;
      default: return false;
    }
  };

  const grams = calculateGrams();
  const totalPct = manualTargets.proteinPct + manualTargets.carbsPct + manualTargets.fatPct;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
      {isLoadingProfile ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-slate-500 dark:text-slate-400">Cargando perfil...</p>
        </div>
      ) : isSuccessView ? (
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="relative mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-12 w-12" />
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping duration-1000" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">¡Perfil Configurado!</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Tus objetivos nutricionales se han calculado con precisión científica.</p>
            </div>

            {/* Macro Summary Cards */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Presupuesto Diario</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  {savedProfile?.targetCalories} kcal
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 rounded-xl">
                  <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Proteínas</p>
                  <p className="text-lg font-extrabold text-rose-950 dark:text-rose-300 mt-1">{savedProfile?.targetProtein}g</p>
                </div>
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/30 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Carbos</p>
                  <p className="text-lg font-extrabold text-amber-950 dark:text-amber-300 mt-1">{savedProfile?.targetCarbs}g</p>
                </div>
                <div className="p-3 bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-950/30 rounded-xl">
                  <p className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider">Grasas</p>
                  <p className="text-lg font-extrabold text-sky-950 dark:text-sky-300 mt-1">{savedProfile?.targetFat}g</p>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="pt-2 text-left text-xs space-y-1 text-slate-500 dark:text-slate-400">
                <p>🥗 Dieta: <strong className="text-slate-700 dark:text-slate-300">
                  {savedProfile?.dietType === "STANDARD" ? "Estándar" : 
                   savedProfile?.dietType === "VEGETARIAN" ? "Vegetariana" : 
                   savedProfile?.dietType === "VEGAN" ? "Vegana" : "Keto"}
                </strong></p>
                <p>🍳 Cocina: <strong className="text-slate-700 dark:text-slate-300">
                  {savedProfile?.culinaryStyle === "CLASSIC" ? "Fitness Clásico" : 
                   savedProfile?.culinaryStyle === "MEDITERRANEAN" ? "Mediterránea / Variada" : "Fácil y Rápido"}
                </strong></p>
                {savedProfile?.allergens && (
                  <p>⚠️ Exclusiones: <strong className="text-red-600 dark:text-red-400">{savedProfile.allergens}</strong></p>
                )}
              </div>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push("/nutricion?generate=true")}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200 animate-pulse" />
                Generar Dieta Personalizada
              </button>

              <button 
                onClick={() => router.push("/nutricion")}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Ir al Diario de Nutrición
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="w-full max-w-lg">
        {isEditing && (
          <button 
            onClick={() => router.push("/nutricion")} 
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver sin guardar
          </button>
        )}

        {!isWizardMode ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="mx-auto bg-yellow-100 dark:bg-yellow-500/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-yellow-500">
                <TargetIcon size={32} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Establecer Objetivos</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Configura tus macros y calorías diarias de forma manual.</p>
            </div>

            <div className="space-y-6">
              {/* Calories */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Calorías Totales (kcal)</label>
                <input 
                  type="number" 
                  min="500"
                  max="10000"
                  step="50"
                  value={manualTargets.calories}
                  onChange={(e) => setManualTargets({...manualTargets, calories: Number(e.target.value)})}
                  className="w-full text-center text-2xl font-bold rounded-3xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                />
              </div>

              {/* Macros Distribution */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white">Distribución de Macros</h3>
                  <span className={cn("text-sm font-semibold px-2 py-1 rounded-md", totalPct === 100 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400")}>
                    {totalPct}%
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-rose-500">Proteína ({manualTargets.proteinPct}%)</span>
                      <span className="text-slate-500">{grams.protein}g</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" max="100" 
                      value={manualTargets.proteinPct || ""} 
                      onChange={(e) => handleManualInput("proteinPct", Number(e.target.value))}
                      className="w-full text-center font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-amber-500">Carbohidratos ({manualTargets.carbsPct}%)</span>
                      <span className="text-slate-500">{grams.carbs}g</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" max="100" 
                      value={manualTargets.carbsPct || ""} 
                      onChange={(e) => handleManualInput("carbsPct", Number(e.target.value))}
                      className="w-full text-center font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-sky-500">Grasas ({manualTargets.fatPct}%)</span>
                      <span className="text-slate-500">{grams.fat}g</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" max="100" 
                      value={manualTargets.fatPct || ""} 
                      onChange={(e) => handleManualInput("fatPct", Number(e.target.value))}
                      className="w-full text-center font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Preferencias de Dieta (Manual Mode) */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-violet-500" /> Preferencias alimenticias
                </h3>
                
                {/* Diet Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de Dieta</label>
                  <select
                    value={formData.dietType}
                    onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-905 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="STANDARD">Estándar (Todo tipo de alimentos)</option>
                    <option value="VEGETARIAN">Vegetariana (Sin carne ni pescado)</option>
                    <option value="VEGAN">Vegana (100% origen vegetal)</option>
                    <option value="KETO">Keto (Bajo en carbohidratos)</option>
                  </select>
                </div>

                {/* Culinary Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estilo Culinario</label>
                  <select
                    value={formData.culinaryStyle}
                    onChange={(e) => setFormData({ ...formData, culinaryStyle: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-905 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="CLASSIC">Fitness Clásico (Simple y limpio: pollo, arroz, avena)</option>
                    <option value="MEDITERRANEAN">Variada / Mediterránea (Grasas saludables, pescados, lácteos)</option>
                    <option value="QUICK">Fácil y Rápido (Menos ingredientes, preparación rápida)</option>
                  </select>
                </div>

                {/* Allergens */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Exclusiones / Alérgenos</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "GLUTEN", label: "Gluten" },
                      { id: "LACTOSE", label: "Lactosa" },
                      { id: "NUTS", label: "Frutos Secos" },
                      { id: "EGG", label: "Huevo" },
                      { id: "FISH", label: "Pescado" },
                    ].map((allergen) => {
                      const isSelected = formData.allergens.includes(allergen.id);
                      return (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? formData.allergens.filter((a) => a !== allergen.id)
                              : [...formData.allergens, allergen.id];
                            setFormData({ ...formData, allergens: updated });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                            isSelected
                              ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                            {allergen.label}
                          </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleManualSubmit}
                disabled={totalPct !== 100 || isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-3xl font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-all shadow-xl shadow-yellow-500/20 mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Guardar Objetivos"}
              </button>

              <div className="text-center mt-6">
                <button 
                  onClick={() => setIsWizardMode(true)}
                  className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium"
                >
                  <Wand2 className="w-4 h-4" />
                  ¿No sabes qué objetivos ponerte? Calculadora automática
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar for Wizard */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "h-1.5 flex-1 mx-1 rounded-full transition-all duration-300",
                      s <= step ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Paso {step} de 5
                </p>
                <button 
                  onClick={() => setIsWizardMode(false)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Volver a modo manual
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="mx-auto bg-cyan-50 dark:bg-cyan-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-cyan-500">
                      <User size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sobre ti</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Necesitamos algunos datos biométricos para calcular tu metabolismo basal.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({ ...formData, gender: "male" })}
                      className={cn("p-4 rounded-2xl border-2 text-center cursor-pointer transition-all", formData.gender === "male" ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-300" : "border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-800")}
                    >
                      <p className="font-semibold">Hombre</p>
                    </div>
                    <div 
                      onClick={() => setFormData({ ...formData, gender: "female" })}
                      className={cn("p-4 rounded-2xl border-2 text-center cursor-pointer transition-all", formData.gender === "female" ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-300" : "border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-800")}
                    >
                      <p className="font-semibold">Mujer</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Edad (años)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="120"
                      value={formData.age} 
                      onChange={e => setFormData({ ...formData, age: e.target.value })} 
                      className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peso ({weightUnit})</label>
                      <input 
                        type="number" 
                        min="1"
                        max="500"
                        value={formData.weight} 
                        onChange={e => setFormData({ ...formData, weight: e.target.value })} 
                        className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Altura ({measurementUnit})</label>
                      <input 
                        type="number" 
                        min="1"
                        max="300"
                        value={formData.height} 
                        onChange={e => setFormData({ ...formData, height: e.target.value })} 
                        className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="mx-auto bg-amber-50 dark:bg-amber-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-amber-500">
                      <Activity size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nivel de Actividad</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">¿Cómo de activo eres en tu día a día?</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: "SEDENTARY", label: "Sedentario", desc: "Trabajo de oficina, poco o ningún ejercicio." },
                      { id: "LIGHT", label: "Ligero", desc: "Ejercicio ligero 1-3 días a la semana." },
                      { id: "MODERATE", label: "Moderado", desc: "Ejercicio moderado 3-5 días a la semana." },
                      { id: "ACTIVE", label: "Activo", desc: "Ejercicio fuerte 6-7 días a la semana." },
                      { id: "VERY_ACTIVE", label: "Muy Activo", desc: "Trabajo físico o entrenamiento doble diario." },
                    ].map(level => (
                      <div 
                        key={level.id}
                        onClick={() => setFormData({ ...formData, activityLevel: level.id })}
                        className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between", formData.activityLevel === level.id ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/20" : "border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800")}
                      >
                        <div>
                          <p className={cn("font-bold text-lg", formData.activityLevel === level.id ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-white")}>{level.label}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{level.desc}</p>
                        </div>
                        {formData.activityLevel === level.id && <CheckCircle2 className="text-amber-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="mx-auto bg-blue-50 dark:bg-blue-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-blue-500">
                      <TargetIcon size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tu Objetivo</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">¿Qué quieres lograr con tu nutrición?</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: "LOSE", label: "Perder Grasa", desc: "Déficit calórico para definir." },
                      { id: "MAINTAIN", label: "Mantenimiento", desc: "Mantener tu peso actual y recomponer." },
                      { id: "GAIN", label: "Ganar Masa Muscular", desc: "Superávit calórico controlado." },
                    ].map(goal => (
                      <div 
                        key={goal.id}
                        onClick={() => setFormData({ ...formData, goal: goal.id })}
                        className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between", formData.goal === goal.id ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800")}
                      >
                        <div>
                          <p className={cn("font-bold text-lg", formData.goal === goal.id ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white")}>{goal.label}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{goal.desc}</p>
                        </div>
                        {formData.goal === goal.id && <CheckCircle2 className="text-blue-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="mx-auto bg-emerald-50 dark:bg-emerald-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-emerald-500">
                      <Scale size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agresividad del Plan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                      {formData.goal === "LOSE" ? "¿Qué tan rápido quieres perder peso?" : 
                       formData.goal === "GAIN" ? "¿A qué ritmo quieres ganar masa?" : 
                       "Confirmar mantenimiento"}
                    </p>
                  </div>

                  {formData.goal === "MAINTAIN" ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                      <CheckCircle2 className="mx-auto text-emerald-500 mb-2 w-10 h-10" />
                      <p className="text-emerald-800 dark:text-emerald-300 font-medium">Todo listo para generar tu plan de mantenimiento.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { id: "MILD", label: "Suave", desc: formData.goal === "LOSE" ? "Déficit del 10%. Pérdida lenta pero muy sostenible." : "Superávit del 10%. Ganancia muy limpia." },
                        { id: "MODERATE", label: "Moderado", desc: formData.goal === "LOSE" ? "Déficit del 20%. Ritmo estándar recomendado." : "Superávit del 20%. Balance ideal." },
                        { id: "AGGRESSIVE", label: "Agresivo", desc: formData.goal === "LOSE" ? "Déficit del 30%. Rápido, requiere disciplina." : "Superávit del 30%. Ganancia rápida (más grasa)." },
                      ].map(agg => (
                        <div 
                          key={agg.id}
                          onClick={() => setFormData({ ...formData, aggressiveness: agg.id })}
                          className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between", formData.aggressiveness === agg.id ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800")}
                        >
                          <div>
                            <p className={cn("font-bold text-lg", formData.aggressiveness === agg.id ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>{agg.label}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{agg.desc}</p>
                          </div>
                          {formData.aggressiveness === agg.id && <CheckCircle2 className="text-emerald-500" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto bg-violet-100 dark:bg-violet-500/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-violet-500">
                      <ChefHat size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Preferencias de Dieta</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Adaptaremos las comidas generadas a tus gustos y restricciones.</p>
                  </div>

                  {/* Diet Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Dieta</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "STANDARD", label: "Estándar", desc: "Todo tipo de alimentos" },
                        { id: "VEGETARIAN", label: "Vegetariana", desc: "Sin carne ni pescado" },
                        { id: "VEGAN", label: "Vegana", desc: "100% origen vegetal" },
                        { id: "KETO", label: "Keto", desc: "Bajo en carbohidratos" },
                      ].map((diet) => (
                        <button
                          key={diet.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, dietType: diet.id })}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-20",
                            formData.dietType === diet.id
                              ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{diet.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{diet.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Culinary Style */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Estilo Gastronómico</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "CLASSIC", label: "Fitness Clásico", desc: "Arroz, pollo, claras..." },
                        { id: "MEDITERRANEAN", label: "Mediterráneo", desc: "Salud y variedad" },
                        { id: "QUICK", label: "Fácil/Rápido", desc: "Poco tiempo/prep" },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, culinaryStyle: style.id })}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-24",
                            formData.culinaryStyle === style.id
                              ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white leading-tight">{style.label}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-1">{style.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Exclusiones / Alérgenos</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "GLUTEN", label: "Gluten" },
                        { id: "LACTOSE", label: "Lactosa" },
                        { id: "NUTS", label: "Frutos Secos" },
                        { id: "EGG", label: "Huevo" },
                        { id: "FISH", label: "Pescado" },
                      ].map((allergen) => {
                        const isSelected = formData.allergens.includes(allergen.id);
                        return (
                          <button
                            key={allergen.id}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? formData.allergens.filter((a) => a !== allergen.id)
                                : [...formData.allergens, allergen.id];
                              setFormData({ ...formData, allergens: updated });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                              isSelected
                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                          >
                            {allergen.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex gap-3">
                {step > 1 && (
                  <button 
                    onClick={handleBack}
                    className="flex-1 py-3.5 px-4 rounded-3xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                    Atrás
                  </button>
                )}
                
                {step < 5 ? (
                  <button 
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 rounded-3xl font-semibold text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 transition-all shadow-soft shadow-cyan-500/20"
                  >
                    Siguiente <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleWizardSubmit}
                    disabled={!isStepValid() || isSubmitting}
                    className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 rounded-3xl font-bold text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 transition-all shadow-xl shadow-cyan-500/30"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Guardar y Generar Dieta"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
