"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, Apple, Building2, Dumbbell, Loader2, ArrowRight, Flame, CalendarDays, Clock, TrendingUp, Zap, Trophy, ChevronRight, Calendar, QrCode, RefreshCw, X, Maximize2, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { SubscriptionBanner } from "@/components/shared/SubscriptionBanner";
import { usePreferences } from "@/context/PreferencesContext";
import QRCode from "qrcode";

interface WeeklyChartEntry { day: string; minutos: number; count: number; }
interface RecentSession { id: string; routineName: string; date: string; durationMinutes: number; volume: number; setsCount: number; }

interface DashboardData {
  routinesCount: number;
  lastWorkoutDate: string | null;
  weeklySessionsCount: number;
  weeklyVolume: number;
  weeklyMinutes: number;
  weeklyChart: WeeklyChartEntry[];
  streak: number;
  totalSessions: number;
  recentSessions: RecentSession[];
}

interface FoodEntry { calories: number; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 text-xs border-solid">
        <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="font-bold text-slate-800 dark:text-white">
          Duración: <span className="text-primary dark:text-cyan-400">{payload[0].value} min</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomTick = ({ x, y, payload }: any) => {
  return (
    <text x={x} y={y + 12} fill="#94a3b8" fontSize={12} fontWeight={700} textAnchor="middle">
      {payload.value}
    </text>
  );
};

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const { weightUnit } = usePreferences();
  const [isLoading, setIsLoading] = useState(true);
  const [caloriesToday, setCaloriesToday] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [mounted, setMounted] = useState(false);

  // Estados locales sincronizados en tiempo real de la base de datos
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveEndDate, setLiveEndDate] = useState<string | null>(null);
  const [serverNow, setServerNow] = useState<string | null>(null);

  const finalStatus = liveStatus || session?.user?.subscriptionStatus || "INACTIVE";
  const finalEndDate = liveEndDate !== null ? liveEndDate : session?.user?.subscriptionEndDate;
  const nowRef = serverNow ? new Date(serverNow) : new Date();

  const isSubscriptionExpired = finalEndDate ? new Date(finalEndDate) < nowRef : false;
  const isSubscriptionInactive = finalStatus !== "ACTIVE" || isSubscriptionExpired;

  useEffect(() => {
    setMounted(true);
  }, []);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomedCanvasRef = useRef<HTMLCanvasElement>(null);

  // Acceso QR States
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(20);
  const [isZoomed, setIsZoomed] = useState(false);

  const fetchQrToken = async (currentStatus?: string, currentEndDate?: string | null, currentServerNow?: string) => {
    // Validar cuota antes de generar
    const sNow = currentServerNow ? new Date(currentServerNow) : (serverNow ? new Date(serverNow) : new Date());
    const sEndDate = currentEndDate !== undefined ? currentEndDate : (liveEndDate !== null ? liveEndDate : session?.user?.subscriptionEndDate);
    const sStatus = currentStatus !== undefined ? currentStatus : (liveStatus || session?.user?.subscriptionStatus || "INACTIVE");
    const isExpiredVal = sEndDate ? new Date(sEndDate) < sNow : false;
    const isInactiveVal = sStatus !== "ACTIVE" || isExpiredVal;

    if (isInactiveVal) {
      setQrToken(null);
      return;
    }

    setIsQrLoading(true);
    try {
      const res = await fetch("/api/user/access-token");
      if (res.ok) {
        const json = await res.json();
        setQrToken(json.token);
        setQrTimeLeft(20);
      } else {
        setQrToken(null);
      }
    } catch (e) {
      console.error(e);
      setQrToken(null);
    } finally {
      setIsQrLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrToken) {
      if (qrTimeLeft > 0) {
        timer = setInterval(() => {
          setQrTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        // Auto-refresh when time runs out
        fetchQrToken();
      }
    }
    return () => clearInterval(timer);
  }, [qrToken, qrTimeLeft]);

  useEffect(() => {
    if (qrToken && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrToken,
        {
          width: 160,
          margin: 1.5,
          color: {
            dark: "#0f172a", // slate-900
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [qrToken]);

  useEffect(() => {
    if (qrToken && isZoomed && zoomedCanvasRef.current) {
      QRCode.toCanvas(
        zoomedCanvasRef.current,
        qrToken,
        {
          width: 260,
          margin: 1.5,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("Error generating zoomed QR code:", error);
        }
      );
    }
  }, [qrToken, isZoomed]);

  const GOAL_CALORIES = 2500;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Sincronizar cuota en tiempo real de la base de datos
        let currentStatus = session?.user?.subscriptionStatus || "INACTIVE";
        let currentEndDate = session?.user?.subscriptionEndDate || null;
        let currentServerNow = session?.user?.serverNow || new Date().toISOString();

        try {
          const subRes = await fetch("/api/user/subscription-status");
          if (subRes.ok) {
            const subData = await subRes.json();
            setLiveStatus(subData.subscriptionStatus);
            setLiveEndDate(subData.subscriptionEndDate);
            setServerNow(subData.serverNow);

            currentStatus = subData.subscriptionStatus;
            currentEndDate = subData.subscriptionEndDate;
            currentServerNow = subData.serverNow;

            // Si el estado en DB difiere del de la sesión NextAuth, sincronizar en background
            if (
              subData.subscriptionStatus !== session?.user?.subscriptionStatus ||
              subData.subscriptionEndDate !== session?.user?.subscriptionEndDate
            ) {
              console.log("[Dashboard] Sincronizando sesión NextAuth con la Base de Datos...");
              await update({
                subscriptionStatus: subData.subscriptionStatus,
                subscriptionEndDate: subData.subscriptionEndDate,
              });
            }
          }
        } catch (subErr) {
          console.warn("[Dashboard] Error al sincronizar cuota en tiempo real (usando datos de sesión local):", subErr);
        }

        const nowRef = new Date(currentServerNow);
        const today = nowRef.toISOString().split("T")[0];

        // Consultas de datos de entrenamiento y nutrición tolerantes a fallos individuales de red
        try {
          const nutritionRes = await fetch(`/api/nutrition?date=${today}`);
          if (nutritionRes.ok) {
            const nd = await nutritionRes.json();
            setCaloriesToday((nd.entries || []).reduce((a: number, f: FoodEntry) => a + f.calories, 0));
          }
        } catch (err) {
          console.warn("[Dashboard] Error al sincronizar datos de nutrición:", err);
        }

        try {
          const statsRes = await fetch("/api/dashboard");
          if (statsRes.ok) {
            setData(await statsRes.json());
          }
        } catch (err) {
          console.warn("[Dashboard] Error al sincronizar datos de actividad física:", err);
        }

        try {
          const attendanceRes = await fetch("/api/user/stats/attendance");
          if (attendanceRes.ok) {
            setAttendanceStats(await attendanceRes.json());
          }
        } catch (err) {
          console.warn("[Dashboard] Error al sincronizar racha de asistencia:", err);
        }
        
        // Auto-fetch QR Access Code Token con los estados de cuota actualizados en caliente (siempre se intenta generar)
        try {
          await fetchQrToken(currentStatus, currentEndDate, currentServerNow);
        } catch (qrErr) {
          console.error("[Dashboard] Error al generar token QR de acceso:", qrErr);
        }
      } catch (e) {
        console.error("[Dashboard] Error crítico de inicialización:", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (session?.user) fetchAll();
    else if (status === "unauthenticated") setIsLoading(false);
  }, [session, status]);

  const calPct = Math.min(Math.round((caloriesToday / GOAL_CALORIES) * 100), 100);
  const weekHours = data ? Math.floor(data.weeklyMinutes / 60) : 0;
  const weekMins = data ? data.weeklyMinutes % 60 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-305">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-widest mb-1">Dashboard</p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                  ¡Hola, <span className="bg-gradient-to-r from-cyan-500 to-primary bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || "Deportista"}</span>!
                </h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Aquí tienes tu resumen de hoy.</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 self-start sm:self-auto">
                {session?.user?.gymName && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-cyan-300">
                    <Building2 className="h-3.5 w-3.5" />
                    {session.user.gymName}
                  </div>
                )}
                {finalEndDate && finalStatus === "ACTIVE" && !isSubscriptionExpired ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Clock className="h-3.5 w-3.5" />
                    Cuota activa hasta: {new Date(finalEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 animate-pulse">
                    <Clock className="h-3.5 w-3.5 text-rose-500" />
                    Cuota inactiva / expirada
                  </div>
                )}
              </div>
            </div>

            {/* Mini Stats Row */}
            {data && (
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5">
                  <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {attendanceStats !== null ? attendanceStats.streak : data.streak}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {attendanceStats !== null
                      ? `semana${attendanceStats.streak !== 1 ? "s" : ""} de racha`
                      : `día${data.streak !== 1 ? "s" : ""} de racha`}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5">
                  <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{data.totalSessions}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">entrenos totales</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5">
                  <Zap className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{data.weeklySessionsCount}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">esta semana</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <SubscriptionBanner />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : (
          <>
            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Col 1: Weekly Chart */}
              <div className="lg:col-span-1 order-2 lg:order-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm min-w-0 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actividad Semanal</h2>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {weekHours > 0 && <>{weekHours}<span className="text-base font-bold text-slate-400">h </span></>}
                      {weekMins}<span className="text-base font-bold text-slate-400">min</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{data?.weeklyVolume?.toLocaleString() || 0}<span className="text-xs text-slate-400 ml-0.5 capitalize">{weightUnit}</span></p>
                    </div>
                  </div>
                </div>
                <div className="h-44 w-full relative">
                  {mounted ? (
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart key="weekly-activity-chart" data={data?.weeklyChart || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={<CustomTick />} />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)', radius: 8 } as any}
                        />
                        <Bar dataKey="minutos" radius={[8, 8, 4, 4]} barSize={32}>
                          {(data?.weeklyChart || []).map((entry, index) => (
                            <Cell key={`c-${index}`} fill={entry.minutos > 0 ? '#0891b2' : 'rgba(148,163,184,0.1)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Col 2: Pase de Acceso QR Card (Renders first on mobile for immediate QR access!) */}
              <div className="lg:col-span-1 order-1 lg:order-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pase de Acceso QR</h3>
                      {!isSubscriptionInactive && qrToken && qrTimeLeft > 0 && !isQrLoading ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Activo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Restringido</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Refresh Button */}
                  {!isSubscriptionInactive && qrToken && qrTimeLeft > 0 && !isQrLoading && (
                    <button
                      onClick={() => fetchQrToken()}
                      title="Actualizar código"
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800/80 text-slate-400 hover:text-primary hover:border-primary/20 dark:hover:text-cyan-400 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-900/40 relative min-h-[200px]">
                  {isSubscriptionInactive ? (
                    <div className="flex flex-col items-center text-center p-4 py-6 animate-in fade-in duration-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 mb-3 border border-rose-100 dark:border-rose-900/30 shrink-0">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Acceso Restringido</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-1 max-w-[190px] leading-normal font-medium">
                        Tu cuota ha expirado o está inactiva en el centro. Renuévala para activar tu código QR de acceso.
                      </p>
                      <Link
                        href="/dashboard/pago"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-soft shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-95 transition-all"
                      >
                        Pagar Cuota
                      </Link>
                    </div>
                  ) : isQrLoading ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs font-bold text-slate-400">Generando pase...</span>
                    </div>
                  ) : qrTimeLeft <= 0 ? (
                    <div className="flex flex-col items-center text-center p-2 py-4">
                      <p className="text-sm font-bold text-red-500 mb-1">Código Expirado</p>
                      <p className="text-[11px] text-slate-400 mb-3">Expira cada 20 segundos por seguridad.</p>
                      <button
                        onClick={() => fetchQrToken()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-primary px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" /> Regenerar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div 
                        onClick={() => setIsZoomed(true)}
                        className="bg-white p-2.5 rounded-xl shadow-inner border border-slate-100 flex justify-center items-center cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all relative group"
                        title="Toca para ampliar"
                      >
                        <canvas ref={canvasRef} className="rounded-lg bg-white" />
                        {/* Smooth hover zoom icon */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center text-white">
                          <Maximize2 className="h-5 w-5 text-white animate-pulse" />
                        </div>
                      </div>

                      {qrTimeLeft > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-cyan-500" />
                          <span>Expira en {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, "0")}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Col 3: Nutrition Card */}
              <div className="lg:col-span-1 order-3 lg:order-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500">
                    <Apple className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nutrición Hoy</h3>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {caloriesToday}<span className="text-sm font-bold text-slate-400 ml-1">kcal</span>
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ {GOAL_CALORIES}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={cn("h-full rounded-full transition-all duration-1000", calPct > 100 ? "bg-red-500" : "bg-gradient-to-r from-orange-400 to-orange-500")} style={{ width: `${calPct}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400 text-right">{calPct}% del objetivo</p>
              </div>

            </div>

            {/* Recent Activity + Quick Actions row */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Recent Sessions */}
              <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Actividad Reciente
                  </h2>
                  <Link href="/perfil" className="text-xs font-bold text-primary hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">Ver todo →</Link>
                </div>
                {data?.recentSessions && data.recentSessions.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.recentSessions.slice(0, 4).map((s) => (
                      <Link 
                        key={s.id}
                        href="/perfil"
                        className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-cyan-400 dark:group-hover:text-cyan-300 transition-colors duration-150">
                              {s.routineName}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1 flex items-center gap-1.5 capitalize">
                              <Calendar className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-600" />
                              {new Date(s.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6">
                          {/* Duration Card Pill */}
                          <div className="bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl px-3.5 py-1.5 flex flex-col justify-center min-w-[85px] text-center">
                            <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">DURACIÓN</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1.5 flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-cyan-400 shrink-0" />
                              {s.durationMinutes}m
                            </span>
                          </div>

                          {/* Volume Card Pill */}
                          <div className="bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl px-3.5 py-1.5 flex flex-col justify-center min-w-[85px] text-center">
                            <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">VOLUMEN</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1.5 flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                              {s.volume.toLocaleString()}{weightUnit}
                            </span>
                          </div>

                          {/* Interactive Click Indicator Chevron */}
                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cyan-400 shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <Dumbbell className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">Aún no hay entrenamientos registrados.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accesos Rápidos</h2>

                <Link href="/nutricion" className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-primary dark:hover:border-cyan-800 hover:shadow-soft transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 p-2.5 text-orange-500"><Apple className="h-5 w-5" /></div>
                    <div><p className="font-bold text-sm text-slate-900 dark:text-white">Registrar Comida</p><p className="text-[11px] text-slate-400 font-medium">Diario nutricional</p></div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/gimnasio" className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-primary dark:hover:border-cyan-800 hover:shadow-soft transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/30 p-2.5 text-primary dark:text-cyan-400"><Dumbbell className="h-5 w-5" /></div>
                    <div><p className="font-bold text-sm text-slate-900 dark:text-white">Ir al Gimnasio</p><p className="text-[11px] text-slate-400 font-medium">Ver tu centro</p></div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/entrenamientos" className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-primary dark:hover:border-cyan-800 hover:shadow-soft transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-emerald-600 dark:text-emerald-400"><Activity className="h-5 w-5" /></div>
                    <div><p className="font-bold text-sm text-slate-900 dark:text-white">Mis Rutinas</p><p className="text-[11px] text-slate-400 font-medium">Entrenar ahora</p></div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/clases" className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-primary dark:hover:border-cyan-800 hover:shadow-soft transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-2.5 text-violet-600 dark:text-violet-400"><CalendarDays className="h-5 w-5" /></div>
                    <div><p className="font-bold text-sm text-slate-900 dark:text-white">Clases</p><p className="text-[11px] text-slate-400 font-medium">Reservar plaza</p></div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Zoomed QR Access Pass Modal */}
      {isZoomed && qrToken && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-sm flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 p-6 text-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white text-xl flex items-center gap-2">
                <QrCode className="h-5 w-5 text-cyan-500" /> Ampliar Pase QR
              </h3>
              <button 
                onClick={() => setIsZoomed(false)}
                className="h-8 w-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Muestra este código QR ampliado en el lector del gimnasio para autorizar tu acceso.
            </p>

            <div className="flex flex-col items-center justify-center bg-white p-5 rounded-3xl border border-slate-100 shadow-md mx-auto">
              <canvas ref={zoomedCanvasRef} className="rounded-2xl max-w-full bg-white" />
            </div>

            {!isQrLoading && qrTimeLeft > 0 ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                <span>Expira en {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, "0")}</span>
              </div>
            ) : (
              <p className="mt-6 text-xs text-red-500 font-bold">Código Expirado. Cierra para regenerar.</p>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
