"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, Activity, Target as TargetIcon, Scale, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NutritionOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    weight: "",
    height: "",
    activityLevel: "",
    goal: "",
    aggressiveness: "",
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
            });
          } else if (isEditing) {
            // User shouldn't be editing if they have no profile
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

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user/nutrition-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/nutricion");
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
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
      {isLoadingProfile ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-slate-500 dark:text-slate-400">Cargando perfil...</p>
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
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 flex-1 mx-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                )}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
            Paso {step} de 4
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="mx-auto bg-cyan-50 dark:bg-cyan-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-primary">
                  <User size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sobre ti</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Necesitamos algunos datos biométricos para calcular tu metabolismo basal.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setFormData({ ...formData, gender: "male" })}
                  className={cn("p-4 rounded-2xl border-2 text-center cursor-pointer transition-all", formData.gender === "male" ? "border-primary bg-cyan-50/50 dark:bg-cyan-900/20 text-primary dark:text-cyan-300" : "border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-800")}
                >
                  <p className="font-semibold">Hombre</p>
                </div>
                <div 
                  onClick={() => setFormData({ ...formData, gender: "female" })}
                  className={cn("p-4 rounded-2xl border-2 text-center cursor-pointer transition-all", formData.gender === "female" ? "border-primary bg-cyan-50/50 dark:bg-cyan-900/20 text-primary dark:text-cyan-300" : "border-slate-200 dark:border-slate-800 hover:border-cyan-200 dark:hover:border-cyan-800")}
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
                  className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="500"
                    value={formData.weight} 
                    onChange={e => setFormData({ ...formData, weight: e.target.value })} 
                    className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Altura (cm)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="300"
                    value={formData.height} 
                    onChange={e => setFormData({ ...formData, height: e.target.value })} 
                    className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
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
                <div className="mx-auto bg-blue-50 dark:bg-blue-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-secondary">
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
                    {formData.goal === goal.id && <CheckCircle2 className="text-secondary" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="mx-auto bg-purple-50 dark:bg-purple-950/30 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 text-purple-500">
                  <Scale size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agresividad</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">¿A qué velocidad quieres {formData.goal === "LOSE" ? "perder peso" : "ganar masa"}?</p>
              </div>

              {formData.goal === "MAINTAIN" ? (
                <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-900 dark:text-white font-medium mb-2">Has elegido mantenimiento</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Calcularemos tus calorías de mantenimiento exactas sin déficit ni superávit. Estás listo para continuar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { id: "SLOW", label: "Lento y Sostenible", desc: formData.goal === "LOSE" ? "Déficit de -300 kcal. Ideal para retener músculo." : "Superávit de +300 kcal. Ganancia muy limpia." },
                    { id: "NORMAL", label: "Estándar", desc: formData.goal === "LOSE" ? "Déficit de -500 kcal. Un balance perfecto." : "Superávit de +500 kcal. Ganancia notable." },
                    { id: "AGGRESSIVE", label: "Agresivo", desc: formData.goal === "LOSE" ? "Déficit de -700 kcal. Requiere disciplina alta." : "Superávit de +700 kcal. Cuidado con la grasa." },
                  ].map(agg => (
                    <div 
                      key={agg.id}
                      onClick={() => setFormData({ ...formData, aggressiveness: agg.id })}
                      className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between", formData.aggressiveness === agg.id ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20" : "border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800")}
                    >
                      <div>
                        <p className={cn("font-bold text-lg", formData.aggressiveness === agg.id ? "text-purple-700 dark:text-purple-400" : "text-slate-900 dark:text-white")}>{agg.label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{agg.desc}</p>
                      </div>
                      {formData.aggressiveness === agg.id && <CheckCircle2 className="text-purple-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="flex-1 py-3.5 px-4 rounded-3xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Volver
              </button>
            )}
            
            {step < 4 ? (
              <button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 rounded-3xl font-semibold text-white bg-primary hover:bg-primary disabled:opacity-50 transition-all shadow-soft shadow-cyan-500/20"
              >
                Siguiente <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 rounded-3xl font-bold text-white bg-primary hover:bg-primary disabled:opacity-50 transition-all shadow-xl shadow-cyan-500/30"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Generar Plan"}
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
