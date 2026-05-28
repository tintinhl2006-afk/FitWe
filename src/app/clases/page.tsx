"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Calendar,
  CalendarDays,
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
  const [selectedDate, setSelectedDate] = useState<string>("");

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

  // Filter classes by selectedDate if set
  const filteredClasses = selectedDate
    ? classes.filter((c) => {
        const classDate = new Date(c.startTime).toISOString().split("T")[0];
        return classDate === selectedDate;
      })
    : classes;

  // Group by date
  const grouped = filteredClasses.reduce<Record<string, ClassItem[]>>((acc, c) => {
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

        {/* Horizontal rolling calendar bar */}
        {!isLoading && !noGym && (classes.length > 0 || selectedDate) && (
          <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-900/15 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-500" /> Selecciona una fecha
              </h2>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="text-xs font-bold text-primary hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Ver todas
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Rolling 14-day selector */}
              <div className="flex-1 flex overflow-x-auto gap-2.5 pb-1.5 scrollbar-none scroll-smooth">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dateStr = d.toISOString().split("T")[0];
                  
                  const dayName = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
                  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                  
                  // Count classes for this date
                  const classCount = classes.filter(c => {
                    return new Date(c.startTime).toISOString().split("T")[0] === dateStr;
                  }).length;
                  
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? "" : dateStr)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[72px] py-3.5 rounded-2xl border transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "bg-gradient-to-br from-cyan-500 to-primary text-white border-transparent shadow-md shadow-cyan-500/20 scale-102"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        isSelected ? "text-cyan-100" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {capitalizedDay}
                      </span>
                      <span className="text-xl font-black mt-1 leading-none">
                        {dayNum}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold mt-1",
                        isSelected ? "text-cyan-200" : "text-slate-500 dark:text-slate-550"
                      )}>
                        {capitalizedMonth}
                      </span>
                      
                      {classCount > 0 && (
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full mt-2",
                          isSelected ? "bg-white" : "bg-primary dark:bg-cyan-400"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Premium calendar date picker button */}
              <div className="shrink-0 relative w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 transition-all cursor-pointer shadow-sm">
                <CalendarDays className="h-5 w-5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Seleccionar otra fecha"
                />
              </div>
            </div>
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
        ) : Object.keys(grouped).length === 0 && selectedDate ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No hay clases para este día
            </h3>
            <p className="text-slate-500 max-w-sm mb-4">
              No hay ninguna actividad programada para la fecha seleccionada.
            </p>
            <button
              onClick={() => setSelectedDate("")}
              className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Ver todas las clases
            </button>
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
                <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 capitalize">
                  {date}
                </h2>
                <div className="space-y-3.5">
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
                          "relative rounded-3xl border bg-white dark:bg-slate-900 p-5 pl-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group overflow-hidden",
                          c.isBooked
                            ? "border-cyan-300/80 dark:border-cyan-800/80 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent"
                            : "border-slate-200 dark:border-slate-800 hover:border-cyan-500/30 dark:hover:border-cyan-400/20"
                        )}
                      >
                        {/* Elegant Left Accent Bar */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl",
                          c.isBooked 
                            ? "bg-gradient-to-b from-cyan-400 to-primary" 
                            : !c.isOpen 
                              ? "bg-slate-350 dark:bg-slate-700"
                              : c.isFull
                                ? "bg-red-400"
                                : "bg-gradient-to-b from-violet-500 to-primary"
                        )} />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-black text-slate-950 dark:text-white text-lg tracking-tight group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
                                {c.name}
                              </h3>
                              {c.isBooked && (
                                <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/40 text-primary dark:text-cyan-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Reservada
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                {timeStart} - {timeEnd}
                              </span>
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <UserIcon className="h-3.5 w-3.5 text-violet-500" />
                                {c.instructor}
                              </span>
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Users className="h-3.5 w-3.5 text-emerald-500" />
                                {c.spotsLeft} plaza{c.spotsLeft !== 1 && "s"} libre{c.spotsLeft !== 1 && "s"}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 self-start sm:self-auto">
                            {c.isBooked ? (
                              <button
                                onClick={() => handleCancel(c.userBookingId!)}
                                disabled={actionId === c.userBookingId || !isActive}
                                className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/30 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {actionId === c.userBookingId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                                Cancelar
                              </button>
                            ) : !c.isOpen ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                                <Lock className="h-3.5 w-3.5" />
                                Abre en {timeUntil(c.opensAt!)}
                              </div>
                            ) : c.isFull ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/30 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                Completa
                              </span>
                            ) : (
                              <button
                                onClick={() => handleBook(c.id)}
                                disabled={actionId === c.id || !isActive}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-500/10 hover:shadow-lg hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                              >
                                {actionId === c.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
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
