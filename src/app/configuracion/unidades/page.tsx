"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

export default function UnitsConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [units, setUnits] = useState({
    weightUnit: "kg",
    distanceUnit: "km",
    measurementUnit: "cm",
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await fetch("/api/settings/units");
      if (res.ok) {
        const data = await res.json();
        setUnits({
          weightUnit: data.weightUnit || "kg",
          distanceUnit: data.distanceUnit || "km",
          measurementUnit: data.measurementUnit || "cm",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/settings/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(units)
      });
      if (res.ok) {
        alert("Unidades guardadas correctamente");
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl relative">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unidades de medida</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Personaliza cómo quieres que se muestren los datos en la aplicación.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Unidad de Peso</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Usada para el peso corporal y los ejercicios de fuerza.
            </p>
          </div>
          <select 
            value={units.weightUnit} 
            onChange={(e) => setUnits({...units, weightUnit: e.target.value})}
            className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white outline-none w-full sm:w-40"
          >
            <option value="kg">Kilogramos (kg)</option>
            <option value="lbs">Libras (lbs)</option>
          </select>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Unidad de Distancia</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Usada para ejercicios de cardio como correr o bicicleta.
            </p>
          </div>
          <select 
            value={units.distanceUnit} 
            onChange={(e) => setUnits({...units, distanceUnit: e.target.value})}
            className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white outline-none w-full sm:w-40"
          >
            <option value="km">Kilómetros (km)</option>
            <option value="mi">Millas (mi)</option>
          </select>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Unidad de Medida</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Usada para tu altura y medidas corporales.
            </p>
          </div>
          <select 
            value={units.measurementUnit} 
            onChange={(e) => setUnits({...units, measurementUnit: e.target.value})}
            className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white outline-none w-full sm:w-40"
          >
            <option value="cm">Centímetros (cm)</option>
            <option value="in">Pulgadas (in)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-medium transition-colors"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
