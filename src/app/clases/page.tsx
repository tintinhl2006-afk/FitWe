"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionBanner, useIsSubscriptionActive } from "@/components/shared/SubscriptionBanner";

interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  capacity: number;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  isOpen: boolean;
  isFull: boolean;
  opensAt: string | null;
  userBookingId: string | null;
  isBooked: boolean;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Ahora";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export default function ClasesPage() {
  const isActive = useIsSubscriptionActive();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [noGym, setNoGym] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        setClasses(await res.json());
      } else if (res.status === 400) {
        setNoGym(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async (classId: string) => {
    if (!isActive) return;
    setActionId(classId);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });
      if (res.ok) {
        setToast({ msg: "¡Reserva confirmada!", type: "ok" });
        fetchClasses();
      } else {
        const data = await res.json();
        setToast({ msg: data.message || "Error al reservar", type: "err" });
      }
    } catch {
      setToast({ msg: "Error de conexión", type: "err" });
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!isActive) return;
    setActionId(bookingId);
    try {
      const res = await fetch(`/api/classes?bookingId=${bookingId}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ msg: "Reserva cancelada", type: "ok" });
        fetchClasses();
      }
    } catch {
      setToast({ msg: "Error de conexión", type: "err" });
    } finally {
      setActionId(null);
    }
  };

  // Group by date
  const grouped = classes.reduce<Record<string, ClassItem[]>>((acc, c) => {
    const dateKey = new Date(c.startTime).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="h-7 w-7 text-primary dark:text-cyan-400" />
            Clases del Gimnasio
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Reserva tu plaza con hasta 48 horas de antelación.
          </p>
        </div>

        <SubscriptionBanner />

        {/* Toast */}
        {toast && (
          <div
            className={cn(
              "fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-3xl px-5 py-3.5 shadow-2xl text-sm font-semibold border animate-in slide-in-from-top-4 fade-in duration-300",
              toast.type === "ok"
                ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            )}
          >
            {toast.type === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : noGym ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Sin gimnasio asignado
            </h3>
            <p className="text-slate-500 max-w-sm">
              Tu cuenta no está vinculada a ningún gimnasio. Contacta con tu centro deportivo.
            </p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No hay clases programadas
            </h3>
            <p className="text-slate-500 max-w-sm">
              Tu gimnasio aún no ha configurado clases próximamente.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 capitalize">
                  {date}
                </h2>
                <div className="space-y-3">
                  {items.map((c) => {
                    const timeStart = new Date(c.startTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const timeEnd = new Date(c.endTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={c.id}
                        className={cn(
                          "rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition-all",
                          c.isBooked
                            ? "border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-950/20"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                {c.name}
                              </h3>
                              {c.isBooked && (
                                <span className="text-xs font-bold bg-cyan-100 dark:bg-cyan-900/40 text-primary dark:text-cyan-400 px-2.5 py-0.5 rounded-full">
                                  Reservada
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {timeStart} - {timeEnd}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5" />
                                {c.instructor}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                {c.spotsLeft} plaza{c.spotsLeft !== 1 && "s"} libre{c.spotsLeft !== 1 && "s"}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {c.isBooked ? (
                              <button
                                onClick={() => handleCancel(c.userBookingId!)}
                                disabled={actionId === c.userBookingId || !isActive}
                                className="inline-flex items-center gap-2 rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                              >
                                {actionId === c.userBookingId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                                Cancelar
                              </button>
                            ) : !c.isOpen ? (
                              <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500">
                                <Lock className="h-4 w-4" />
                                Abre en {timeUntil(c.opensAt!)}
                              </div>
                            ) : c.isFull ? (
                              <span className="inline-flex items-center gap-2 rounded-3xl bg-red-50 dark:bg-red-950/30 px-5 py-2.5 text-sm font-bold text-red-600 dark:text-red-400">
                                Completa
                              </span>
                            ) : (
                              <button
                                onClick={() => handleBook(c.id)}
                                disabled={actionId === c.id || !isActive}
                                className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors active:scale-95 disabled:opacity-50"
                              >
                                {actionId === c.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Reservar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
