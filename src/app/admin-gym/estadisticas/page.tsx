"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  DollarSign, 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  BarChart3 
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GymStatsPage() {
  const [data, setData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const [statsRes, attendanceRes] = await Promise.all([
          fetch("/api/admin-gym/stats"),
          fetch("/api/admin-gym/stats/attendance")
        ]);

        if (statsRes.ok) {
          setData(await statsRes.json());
        }
        if (attendanceRes.ok) {
          setAttendanceData(await attendanceRes.json());
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !attendanceData) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        Error al cargar los datos estadísticos.
      </div>
    );
  }

  const activeRate = data.totalClients > 0 
    ? Math.round((data.activeClients / data.totalClients) * 100) 
    : 0;

  // Map backend reasons to user friendly descriptions and color tags
  const reasonLabels: Record<string, { label: string; color: string }> = {
    INACTIVE_SUBSCRIPTION: { label: "Cuota Inactiva / Vencida", color: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" },
    EXPIRED: { label: "Código QR Caducado", color: "bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400" },
    WRONG_GYM: { label: "Cliente de Otro Centro", color: "bg-purple-100 dark:bg-purple-955/40 text-purple-700 dark:text-purple-400" },
    INVALID_SIGNATURE: { label: "Firma QR Inválida/Alterada", color: "bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-400" },
    USER_NOT_FOUND: { label: "Usuario No Registrado", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400" }
  };

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary dark:text-cyan-400" />
          Cuadro de Mando Integrado
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Analíticas financieras en tiempo real e inteligencia de aforo de tu centro deportivo.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingresos este Mes */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-16 w-16 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl">
              <DollarSign className="h-5 w-5 text-primary dark:text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Ingresos este mes
            </h3>
          </div>
          <div className="text-3xl font-black text-primary dark:text-cyan-400">
            {data.currentMonthRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>

        {/* Total Clientes */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-16 w-16 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Total Clientes
            </h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {data.totalClients}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold flex gap-2">
            <span className="text-emerald-500">{data.activeClients} Activos</span> · 
            <span className="text-red-400">{data.inactiveClients} Inactivos</span>
          </p>
        </div>

        {/* Tasa de Retención */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tasa de Retención
            </h3>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {activeRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${activeRate}%` }}
            />
          </div>
        </div>

        {/* Afluencia Hoy */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="h-16 w-16 text-indigo-500" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Accesos Permitidos Hoy
            </h3>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {attendanceData.totalToday}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Visitas registradas mediante código QR
          </p>
        </div>
      </div>

      {/* Main Charts: Revenue vs Weekly attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Evolución de Ingresos (Últimos 6 meses)
            </h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.revenueByMonth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
                  formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Ingresos']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#14b8a6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Attendance Chart */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Visitas de la Última Semana
            </h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceData.weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                  formatter={(value: any) => [value, 'Clientes']}
                />
                <Bar 
                  dataKey="visits" 
                  fill="url(#colorVisits)" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Occupancy (Heatmap / Typical hours) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-slate-400" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Afluencia Horaria Media (Últimos 30 días)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifica rápidamente tus horas pico de mayor concurrencia para gestionar los aforos de las salas.
            </p>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={attendanceData.hourlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                formatter={(value: any) => [value, 'Accesos']}
              />
              <Area 
                type="monotone" 
                dataKey="visits" 
                stroke="#a78bfa" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorHourly)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#a78bfa' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Denied Entries breakdown */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Análisis de Accesos Denegados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Motivos principales por los que se ha bloqueado la entrada en el torno inteligente.
            </p>
          </div>
        </div>

        {attendanceData.deniedCounts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 text-sm">
            No se han registrado incidencias ni accesos denegados recientemente. ¡Todo en regla!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {attendanceData.deniedCounts.map((item: any) => {
              const info = reasonLabels[item.reason] || { label: item.reason, color: "bg-slate-100 text-slate-700" };
              return (
                <div key={item.reason} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center p-2 text-[10px] font-bold ${info.color.split(' ')[0]}`} />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {info.label}
                    </p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${info.color}`}>
                    {item.count} intento{item.count !== 1 && 's'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
