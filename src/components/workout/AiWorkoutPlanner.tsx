"use client";

import { useState } from "react";
import { 
  Loader2, 
  X, 
  Check, 
  Sparkles, 
  Sliders, 
  Dumbbell, 
  CalendarDays,
  Target,
  Activity,
  HeartPulse,
  ArrowLeft,
  ArrowRight,
  Download,
  Clipboard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiWorkoutPlannerProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function AiWorkoutPlanner({ onClose, onSaved }: AiWorkoutPlannerProps) {
  const [setupStep, setSetupStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Setup Form Preferences
  const [customDays, setCustomDays] = useState(3);
  const [customLevel, setCustomLevel] = useState<"principiante" | "intermedio" | "avanzado" | "muy_avanzado">("intermedio");
  const [customGoal, setCustomGoal] = useState<"hipertrofia" | "fuerza" | "recomposicion" | "perdida_grasa" | "rendimiento">("hipertrofia");
  const [customSplit, setCustomSplit] = useState<"auto" | "torso_pierna" | "ppl" | "full_body">("auto");
  const [customPriorities, setCustomPriorities] = useState<string[]>([]);
  const [customLesiones, setCustomLesiones] = useState<string[]>([]);

  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: customDays,
          level: customLevel,
          split: customSplit,
          priorities: customPriorities,
          lesiones: customLesiones,
          goal: customGoal,
        }),
      });
      
      if (!res.ok) {
        throw new Error("No se pudo generar el plan de entrenamiento.");
      }
      
      const data = await res.json();
      setGeneratedPlan(data.plan);
      setSetupStep(3);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error al generar las rutinas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPlan) return;

    const goalMap = {
      hipertrofia: "Ganancia de Masa Muscular (Hipertrofia)",
      fuerza: "Ganancia de Fuerza Máxima",
      recomposicion: "Recomposición Corporal (Pérdida de grasa y ganancia muscular)",
      perdida_grasa: "Pérdida de Grasa / Definición Muscular",
      rendimiento: "Rendimiento y Acondicionamiento Físico General"
    };

    const levelMap = {
      principiante: "Principiante (menos de 1 año)",
      intermedio: "Intermedio (1 - 3 años)",
      avanzado: "Avanzado (3 - 6 años)",
      muy_avanzado: "Muy avanzado (más de 6 años)"
    };

    const splitMap = {
      full_body: "Cuerpo Completo (Full Body)",
      torso_pierna: "Torso / Pierna (Upper / Lower)",
      ppl: "Empuje / Tirón / Pierna (Push / Pull / Legs)",
      auto: "Selección Automática del Motor"
    };

    const goalLabel = goalMap[customGoal] || customGoal;
    const levelLabel = levelMap[customLevel] || customLevel;
    const splitLabel = splitMap[customSplit === "auto" ? (customDays <= 2 ? "full_body" : customDays === 3 ? "ppl" : "torso_pierna") : customSplit] || customSplit;
    const prioritiesText = customPriorities.length > 0 ? customPriorities.join(", ") : "Ninguno en particular";
    const lesionesText = customLesiones.length > 0 && !customLesiones.includes("ninguna") 
      ? customLesiones.join(", ") 
      : "Ninguna molestia declarada";

    let rutinasMarkdown = "";
    generatedPlan.forEach((routine) => {
      rutinasMarkdown += `### 📅 ${routine.name.toUpperCase()}\n`;
      rutinasMarkdown += `| Ejercicio | Series | Repeticiones | RIR | Tempo | Descanso | Justificación |\n`;
      rutinasMarkdown += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
      
      routine.exercises.forEach((ex: any) => {
        rutinasMarkdown += `| **${ex.name}** | ${ex.sets} | ${ex.reps} | RIR ${ex.rir} | ${ex.tempo} | ${ex.descanso} | ${ex.justificacion} |\n`;
      });
      rutinasMarkdown += `\n`;
    });

    const markdownText = `# 🏋️‍♂️ PLAN DE ENTRENAMIENTO PERSONALIZADO — FITWE
*Este plan ha sido diseñado algorítmicamente adaptado a tu nivel, objetivos y salud articular.*

---

## 📊 RESUMEN DEL PERFIL DE ENTRENAMIENTO
* **Objetivo principal**: ${goalLabel}
* **Frecuencia semanal**: ${customDays} días de entrenamiento a la semana
* **Nivel de experiencia**: ${levelLabel}
* **Estructura de rutina**: ${splitLabel}
* **Enfoque en puntos débiles**: ${prioritiesText}
* **Articulaciones protegidas (Evasión de lesiones)**: ${lesionesText}

---

## 🛠️ DESCRIPCIÓN DEL PLAN Y METODOLOGÍA
Este programa utiliza una división **${splitLabel}** diseñada para optimizar la frecuencia de estímulo por grupo muscular y garantizar una recuperación completa entre sesiones.

### Puntos clave del programa:
1. **Doble Progresión**: Tu objetivo es progresar en repeticiones dentro del rango objetivo antes de subir de peso. Por ejemplo, si tu objetivo es 8-12 repeticiones, cuando logres completar todas tus series a 12 repeticiones con buena técnica, sube la carga para la siguiente sesión y vuelve a buscar el rango inferior.
2. **Autorregulación (RIR - Repeticiones en Recámara)**: La intensidad se mide en RIR. Un RIR 1 significa que debes terminar la serie sintiendo que prograsivamente podrías haber realizado exactamente una repetición más antes de fallar. Mantén una técnica perfecta.
3. **Control del Descanso**: Los tiempos de descanso especificados son orientativos pero fundamentales para asegurar la recuperación de los sistemas de fosfágenos (ATP-PC) y optimizar el rendimiento de la serie posterior.
4. **Protección Articular Activa**: Debido a las limitaciones indicadas (${lesionesText}), se han excluido los ejercicios axiales de alto impacto y de sobrecarga articular directa, sustituyéndolos por variantes estables en polea, máquina o peso corporal que permiten un estímulo muscular idéntico con menor estrés articular.

---

## 📋 RUTINAS Y SESIONES DE ENTRENAMIENTO

${rutinasMarkdown}

---

## 🏃‍♂️ PAUTAS DE CALENTAMIENTO Y MOVILIDAD
*Antes de comenzar cada sesión, dedica de 5 a 10 minutos a preparar tu cuerpo:*
1. **Activación Cardiovascular**: 5 minutos de cardio suave (cinta, elíptica o bicicleta) para elevar la temperatura corporal.
2. **Movilidad Articular**: Movimientos dinámicos y rotaciones de hombros, cadera, rodillas y muñecas.
3. **Series de Aproximación**: En el primer ejercicio compuesto de cada grupo muscular, realiza 2-3 series con peso ascendente y bajas repeticiones antes de empezar tus series efectivas de trabajo.

---

## 💡 RECOMENDACIONES GENERALES Y SEGURIDAD
* **Hidratación**: Bebe agua antes, durante y después de la sesión.
* **Control técnico**: Prioriza la calidad del movimiento frente a la carga externa. Cada repetición debe controlarse tanto en la fase concéntrica (subida) como en la fase excéntrica (bajada lenta de 3 segundos).
* **Consistencia**: El factor más determinante para ver resultados es la constancia y el cumplimiento semanal del plan.

*Plan generado con el motor inteligente de FitWe.*
`;

    const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Plan_Entrenamiento_FitWe_${customGoal}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    if (!generatedPlan) return;
    
    let text = `FITWE - PLAN DE ENTRENAMIENTO PERSONALIZADO\n\n`;
    text += `Objetivo: ${customGoal}\n`;
    text += `Días semanales: ${customDays}\n`;
    text += `Nivel: ${customLevel}\n\n`;
    
    generatedPlan.forEach((routine) => {
      text += `RUTINA: ${routine.name}\n`;
      routine.exercises.forEach((ex: any) => {
        text += `- ${ex.name}: ${ex.sets} series x ${ex.reps} repeticiones (RIR ${ex.rir}, descanso: ${ex.descanso})\n`;
      });
      text += `\n`;
    });
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePriority = (group: string) => {
    setCustomPriorities(prev => 
      prev.includes(group) ? prev.filter(x => x !== group) : [...prev, group]
    );
  };

  const handleToggleLesion = (lesion: string) => {
    if (lesion === "ninguna") {
      setCustomLesiones(prev => prev.includes("ninguna") ? [] : ["ninguna"]);
      return;
    }
    setCustomLesiones(prev => {
      const next = prev.includes(lesion) ? prev.filter(x => x !== lesion) : [...prev.filter(x => x !== "ninguna"), lesion];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-50/40 via-transparent to-blue-50/20 dark:from-slate-950/40 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                Generador de Rutina Automática
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura tu perfil para generar rutinas de entrenamiento inteligentes de forma instantánea.
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
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Diseñando tu plan de entrenamiento personalizado...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Error</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <div className="flex gap-2">
              <button 
                onClick={handleGenerate}
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

        {/* Setup Wizard View */}
        {!isLoading && !error && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                     {/* Stepper indicator */}
            <div className="relative mb-4 max-w-sm w-full mx-auto px-4">
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
              <div className="absolute top-5 left-10 right-10 h-0.5 -translate-y-1/2 z-0 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ width: setupStep === 1 ? "0%" : setupStep === 2 ? "50%" : "100%" }} 
                />
              </div>
              
              <div className="relative flex justify-between items-center z-10">
                {[
                  { step: 1, label: "Bases", icon: Sliders },
                  { step: 2, label: "Detalles", icon: Dumbbell },
                  { step: 3, label: "Resumen", icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
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
                        {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold mt-2",
                        isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>            {/* Step Content */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-soft flex flex-col min-h-0">
              
              {/* STEP 1: Basic Preferences */}
              {setupStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      ¿Cuántos días a la semana quieres entrenar?
                    </label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCustomDays(d)}
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex-1",
                            customDays === d
                              ? "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/15"
                              : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:text-slate-300"
                          )}
                        >
                          {d} días
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Objetivo Principal
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "hipertrofia", label: "Ganar músculo", desc: "Hipertrofia" },
                        { id: "fuerza", label: "Ganar fuerza", desc: "Cargas pesadas" },
                        { id: "recomposicion", label: "Recomposición", desc: "Grasa y músculo" },
                        { id: "perdida_grasa", label: "Perder grasa", desc: "Déficit calórico" },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setCustomGoal(g.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customGoal === g.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{g.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-455">{g.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nivel de Experiencia
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "principiante", label: "Principiante", desc: "Menos de 1 año" },
                        { id: "intermedio", label: "Intermedio", desc: "1 - 3 años" },
                        { id: "avanzado", label: "Avanzado", desc: "3 - 6 años" },
                        { id: "muy_avanzado", label: "Muy avanzado", desc: "Más de 6 años" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setCustomLevel(lvl.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customLevel === lvl.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{lvl.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-455">{lvl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Organización del Entrenamiento
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "auto", label: "Auto", desc: "Decisión del plan" },
                        { id: "full_body", label: "Cuerpo Completo", desc: "Full Body" },
                        { id: "torso_pierna", label: "Torso / Pierna", desc: "Upper / Lower" },
                        { id: "ppl", label: "Empuje / Tirón / Pierna", desc: "PPL" },
                      ].map((spl) => (
                        <button
                          key={spl.id}
                          type="button"
                          onClick={() => setCustomSplit(spl.id as any)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between h-16 bg-white dark:bg-slate-900/60",
                            customSplit === spl.id
                              ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 ring-1 ring-cyan-500"
                              : "border-slate-200 dark:border-slate-800 hover:border-cyan-200"
                          )}
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{spl.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-455">{spl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: Custom details (Priorities & Injuries) */}
              {setupStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Priorities */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Puntos a priorizar (Puntos débiles)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral", "Glúteo", "Abdomen"].map((g) => {
                        const isSelected = customPriorities.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleTogglePriority(g)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                              isSelected 
                                ? "bg-cyan-500 text-white border-cyan-500 shadow-sm" 
                                : "bg-white text-slate-650 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Injuries */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Molestias o Limitaciones Articulares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "hombro", label: "Hombro" },
                        { id: "lumbar", label: "Zona Lumbar" },
                        { id: "rodilla", label: "Rodilla" },
                        { id: "codo_muneca", label: "Codo / Muñeca" },
                        { id: "cadera", label: "Cadera" },
                        { id: "ninguna", label: "Ninguna" },
                      ].map((l) => {
                        const isSelected = customLesiones.includes(l.id);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleToggleLesion(l.id)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
                              isSelected 
                                ? "bg-red-500 text-white border-red-500 shadow-sm" 
                                : "bg-white text-slate-650 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                    {customLesiones.length > 0 && !customLesiones.includes("ninguna") && (
                      <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed font-semibold">
                        ⚠️ El motor excluirá ejercicios lesivos de esas zonas (ej: evitar sentadillas si te duele la rodilla, o press militar si te duele el hombro) y asignará alternativas articulares amigables.
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* STEP 3: Summary & Detailed explanation */}
              {setupStep === 3 && generatedPlan && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col flex-1 min-h-0">
                  <div className="flex flex-col items-center justify-center text-center p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl gap-2">
                    <div className="bg-emerald-500 text-white p-2 rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">¡Plan de entrenamiento generado con éxito!</h4>
                      <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Se han creado {generatedPlan.length} rutinas de entrenamiento adaptadas a tu perfil.</p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white px-4 py-3 text-xs font-bold hover:opacity-95 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Guía Detallada (.md)
                    </button>
                    <button
                      onClick={handleCopyClipboard}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-4 h-4" />
                          Copiar Resumen de Rutina
                        </>
                      )}
                    </button>
                  </div>

                  {/* Plan Summary List */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[300px] scrollbar-thin">
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resumen de las Rutinas:</h5>
                    {generatedPlan.map((routine, rIdx) => (
                      <div key={rIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <h6 className="font-extrabold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block animate-pulse" />
                          {routine.name}
                        </h6>
                        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                          {routine.exercises.map((ex: any, eIdx: number) => (
                            <div key={eIdx} className={cn("text-xs flex flex-col gap-1", eIdx > 0 && "pt-3")}>
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{ex.name}</span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-650 dark:text-slate-400 shrink-0">
                                  {ex.sets}x{ex.reps} (RIR {ex.rir})
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                {ex.justificacion}
                              </p>
                              <div className="flex gap-3 text-[9px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                                <span>Tempo: {ex.tempo}</span>
                                <span>·</span>
                                <span>Descanso: {ex.descanso}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Navigation */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 mt-auto shrink-0">
              {setupStep === 1 ? (
                <button 
                  onClick={onClose} 
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              ) : setupStep === 2 ? (
                <button
                  onClick={() => setSetupStep(1)}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              ) : (
                <div />
              )}

              {setupStep === 1 ? (
                <button
                  onClick={() => setSetupStep(2)}
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : setupStep === 2 ? (
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-cyan-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Generar Rutinas
                </button>
              ) : (
                <button
                  onClick={onSaved}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-2xl text-xs shadow-md hover:opacity-95 cursor-pointer"
                >
                  Entendido, ver mis rutinas
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
