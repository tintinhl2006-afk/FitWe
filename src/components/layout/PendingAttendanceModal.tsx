"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingClass {
  id: string;
  className: string;
  startTime: string;
  endTime: string;
}

export function PendingAttendanceModal() {
  const router = useRouter();
  const [pendingClasses, setPendingClasses] = useState<PendingClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Fetch pending class attendance checks
  const fetchPending = async () => {
    try {
      const res = await fetch("/api/user/classes/pending-attendance");
      if (res.ok) {
        const data = await res.json();
        setPendingClasses(data);
      }
    } catch (e) {
      console.error("Error fetching pending class attendances:", e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleResponse = async (bookingId: string, attended: boolean) => {
    setIsSubmitLoading(true);
    try {
      const res = await fetch("/api/user/classes/pending-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, attended }),
      });

      if (res.ok) {
        // Remove the processed class from local state
        setPendingClasses((prev) => prev.filter((c) => c.id !== bookingId));
        // Refresh the router to update dashboard stats / profile stats in real time!
        router.refresh();
      }
    } catch (e) {
      console.error("Error submitting class attendance response:", e);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (pendingClasses.length === 0) return null;

  const currentClass = pendingClasses[0];
  const classDate = new Date(currentClass.startTime);
  
  const formattedDate = classDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formattedStartTime = new Date(currentClass.startTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndTime = new Date(currentClass.endTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in scale-in duration-300 flex flex-col items-center text-center">
        {/* Animated Check/Calendar Icon */}
        <div className="relative flex items-center justify-center mb-5">
          <span className="absolute inline-flex h-16 w-16 rounded-full bg-cyan-500/10 animate-ping duration-1000" />
          <div className="relative h-16 w-16 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/30 text-primary dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/50 shadow-inner">
            <Calendar className="h-8 w-8" />
          </div>
        </div>

        {/* Modal Title */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
          ¿Asististe a clase?
        </h2>
        
        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
          Tu clase de <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentClass.className}</strong> ha finalizado.
        </p>

        {/* Class Date / Time Info Block */}
        <div className="w-full bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 mt-4 text-xs space-y-2.5">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-semibold">
            <span>Día</span>
            <span className="font-bold text-slate-900 dark:text-white capitalize">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-semibold">
            <span>Horario</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{formattedStartTime} - {formattedEndTime}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          Si confirmas la asistencia, la clase se guardará automáticamente en tu historial y sumará a tus minutos de entrenamiento.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 w-full">
          <button
            type="button"
            disabled={isSubmitLoading}
            onClick={() => handleResponse(currentClass.id, false)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50"
          >
            <X className="h-4 w-4 text-red-500" />
            No asistí
          </button>
          
          <button
            type="button"
            disabled={isSubmitLoading}
            onClick={() => handleResponse(currentClass.id, true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary text-white px-4 py-3 text-sm font-bold shadow-md shadow-cyan-500/10 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
          >
            {isSubmitLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                Sí, asistí
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
