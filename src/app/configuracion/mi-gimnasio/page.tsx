"use client";

import { useState, useEffect } from "react";
import { Loader2, Dumbbell, MapPin, AlertCircle, Save } from "lucide-react";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function MiGimnasioConfigPage() {
  const { data: session } = useSession();
  const { showConfirm, showAlert } = useCustomAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentGym, setCurrentGym] = useState<{ name: string | null; location: string | null }>({
    name: null,
    location: null,
  });
  const [gymCode, setGymCode] = useState("");

  const fetchCurrentGym = async () => {
    try {
      const res = await fetch("/api/user/link-gym");
      if (res.ok) {
        const data = await res.json();
        setCurrentGym({
          name: data.gymName,
          location: data.gymLocation,
        });
      }
    } catch (e) {
      console.error("Error loading gym association:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentGym();
  }, []);

  const handleLinkGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gymCode.trim().length !== 6) {
      showAlert("El código del gimnasio debe tener exactamente 6 caracteres.");
      return;
    }

    const action = currentGym.name ? "cambiar" : "vincularte";

    showConfirm(
      `¿Confirmas que deseas ${action} de gimnasio? Si tienes una suscripción activa o reservas programadas en tu centro actual, serán canceladas y desactivadas automáticamente.`,
      async () => {
        setIsSaving(true);
        try {
          const res = await fetch("/api/user/link-gym", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gymCode }),
          });

          const data = await res.json();

          if (res.ok) {
            showAlert(data.message || "Vinculación realizada correctamente.");
            setGymCode("");
            await fetchCurrentGym();
          } else {
            showAlert(data.message || "Error al vincular el gimnasio.");
          }
        } catch (e) {
          showAlert("Error de conexión al servidor.");
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mi Centro Deportivo</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Visualiza el gimnasio al que perteneces actualmente o vincúlate a uno nuevo.
      </p>

      {/* Información del gimnasio actual */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {currentGym.name || "Sin Gimnasio Vinculado"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {currentGym.location || "Vincúlate a un centro para ver su dirección"}
            </p>
          </div>
        </div>
        
        <span
          className={cn(
            "text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full",
            currentGym.name
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {currentGym.name ? "Vinculado" : "Pendiente"}
        </span>
      </div>

      {/* Formulario de Cambio de Gimnasio */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-cyan-500" /> Vincular a otro centro
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Introduce el código alfanumérico de 6 dígitos de tu nuevo gimnasio. 
          Al hacerlo, tu cuota, plan activo e historial de reservas de clases del gimnasio anterior se cancelarán.
        </p>

        <form onSubmit={handleLinkGym} className="space-y-4">
          <div>
            <label htmlFor="gym-code-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Código del Centro Deportivo
            </label>
            <input
              id="gym-code-input"
              type="text"
              required
              maxLength={6}
              placeholder="Ej. FITWE1"
              value={gymCode}
              onChange={(e) => setGymCode(e.target.value.toUpperCase())}
              className="w-full sm:w-64 block rounded-2xl border border-slate-350 dark:border-slate-750 bg-white dark:bg-slate-900 py-3 px-4 text-slate-900 dark:text-white sm:text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-primary transition-all font-mono font-bold tracking-widest"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || gymCode.trim().length !== 6}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 font-bold transition-all cursor-pointer shadow-sm text-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Actualizar Gimnasio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
