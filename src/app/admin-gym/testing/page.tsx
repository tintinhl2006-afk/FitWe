"use client";

import { useState } from "react";
import { Clock, Rocket, RefreshCcw, AlertTriangle, FlaskConical } from "lucide-react";
import { setMockDate, clearMockDate } from "@/app/actions/testingActions";
import { cn } from "@/lib/utils";

export default function TestingPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const handleSetDate = async () => {
    if (!selectedDate) return;
    setIsUpdating(true);
    await setMockDate(selectedDate);
    window.location.reload();
  };

  const handleReset = async () => {
    setIsUpdating(true);
    await clearMockDate();
    window.location.reload();
  };

  const runCron = async () => {
    setIsCronRunning(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/cron/generate-classes");
      const data = await res.json();
      if (res.ok) {
        setCronResult(`Éxito: ${data.message}`);
      } else {
        setCronResult(`Error: ${data.message || "Fallo en la ejecución"}`);
      }
    } catch (e) {
      setCronResult("Error crítico al invocar el CRON");
    } finally {
      setIsCronRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-indigo-600" />
          QA & Testing Lab
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Utiliza el Time Travel para probar lógicas de suscripción y reservas sin esperar semanas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Time Machine Card */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-soft shadow-indigo-200 dark:shadow-none">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Máquina del Tiempo</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Simular Fecha del Sistema
              </label>
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 py-3 px-4 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSetDate}
                disabled={isUpdating || !selectedDate}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <Rocket className="h-4 w-4" />
                Viajar a esta fecha
              </button>
              <button
                onClick={handleReset}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <RefreshCcw className="h-4 w-4" />
                Volver al Presente
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Notas de QA
          </h3>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">1</span>
              El tiempo simulado afecta a las validaciones de 48h en reservas y a la caducidad de suscripciones.
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">2</span>
              Si viajas al futuro, el CRON de generación de clases actuará como si hoy fuera esa fecha.
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">3</span>
              La simulación persiste en tu navegador (vía cookies). Los demás usuarios seguirán en el tiempo real.
            </li>
          </ul>
        </div>
      </div>

      {/* Background Jobs Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simulación de Tareas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ejecuta procesos automáticos bajo demanda.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Motor de Clases (CRON)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Genera clases para los próximos 14 días basadas en las plantillas configuradas.
              </p>
            </div>
            <button
              onClick={runCron}
              disabled={isCronRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-bold shadow-soft shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isCronRunning ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Disparar CRON
            </button>
          </div>

          {cronResult && (
            <div className={cn(
              "p-4 rounded-3xl text-xs font-medium animate-in fade-in slide-in-from-top-2",
              cronResult.startsWith("Éxito") 
                ? "bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/50" 
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50"
            )}>
              {cronResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
