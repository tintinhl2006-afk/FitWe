"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Dumbbell,
  UserCheck,
  CalendarDays,
  Loader2,
  User,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface WeeklyDataPoint {
  day: string;
  date: string;
  sessions: number;
}

interface RecentSession {
  id: string;
  clientId: string;
  clientName: string;
  clientImage: string | null;
  routineName: string;
  endTime: string;
  durationMinutes: number;
}

interface DashboardData {
  totalClients: number;
  activeClients: number;
  monthlyWorkouts: number;
  weeklyData: WeeklyDataPoint[];
  recentActivity: RecentSession[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function AdminGymDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/admin-gym/dashboard");
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      label: "Clientes Totales",
      value: data.totalClients,
      icon: Users,
      color: "text-primary dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      border: "border-cyan-100 dark:border-cyan-900/50",
    },
    {
      label: "Activos (7 días)",
      value: data.activeClients,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      label: "Entrenamientos del mes",
      value: data.monthlyWorkouts,
      icon: Dumbbell,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-100 dark:border-amber-900/50",
    },
  ];

  const maxSessions = Math.max(...data.weeklyData.map((d) => d.sessions), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={cn(
              "rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm",
              kpi.border
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-3xl",
                  kpi.bg
                )}
              >
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
              <TrendingUp className="h-4 w-4 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {kpi.value}
            </p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Actividad del Centro Deportivo
              </h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-600">
              Últimos 7 días
            </span>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.weeklyData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid, #e2e8f0)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "13px",
                      padding: "10px 14px",
                    }}
                    formatter={(value: any) => [`${value} sesiones`, "Entrenamientos"]}
                    labelFormatter={(label: any) => `${label}`}
                    cursor={{ fill: "rgba(99,102,241,0.08)" }}
                  />
                  <Bar dataKey="sessions" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {data.weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.sessions === maxSessions
                            ? "#6366f1"
                            : entry.sessions > 0
                            ? "#a5b4fc"
                            : "#e2e8f0"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Actividad Reciente
            </h2>
          </div>

          {data.recentActivity.length > 0 ? (
            <div className="flex-1 divide-y divide-slate-50 dark:divide-slate-800">
              {data.recentActivity.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin-gym/clientes/${s.clientId}/sesiones/${s.id}`}
                  className="flex items-start gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                    {s.clientImage ? (
                      <img
                        src={s.clientImage}
                        alt={s.clientName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-bold group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
                        {s.clientName}
                      </span>{" "}
                      <span className="text-slate-500 dark:text-slate-400">
                        finalizó
                      </span>{" "}
                      <span className="font-semibold">{s.routineName}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {timeAgo(s.endTime)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        · {s.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-cyan-400 transition-colors mt-1 shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-6">
              <Dumbbell className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
              <p className="text-sm text-slate-500">
                Aún no hay entrenamientos registrados por tus clientes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Gestionar Clientes",
            href: "/admin-gym/clientes",
            icon: Users,
            color: "text-secondary dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            title: "Estadísticas",
            href: "/admin-gym/estadisticas",
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
          },
          {
            title: "Configuración",
            href: "/admin-gym/configuracion",
            icon: Building2,
            color: "text-slate-600 dark:text-slate-400",
            bg: "bg-slate-100 dark:bg-slate-800",
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-soft hover:border-cyan-200 dark:hover:border-cyan-800 transition-all group"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-3xl shrink-0",
                link.bg
              )}
            >
              <link.icon className={cn("h-5 w-5", link.color)} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
              {link.title}
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-cyan-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
