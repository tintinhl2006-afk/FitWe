"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, Users, Activity, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GymStatsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin-gym/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        Error al cargar los datos estadísticos.
      </div>
    );
  }

  const activeRate = data.totalClients > 0 
    ? Math.round((data.activeClients / data.totalClients) * 100) 
    : 0;

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Cuadro de Mando
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Analíticas financieras y estado de tus clientes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos este Mes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
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
          <div className="text-4xl font-black text-primary dark:text-cyan-400">
            {data.currentMonthRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>

        {/* Total Clientes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-16 w-16 text-secondary" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
              <Users className="h-5 w-5 text-secondary dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Total Clientes
            </h3>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white">
            {data.totalClients}
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            <span className="text-emerald-500">{data.activeClients} Activos</span> · <span className="text-red-400">{data.inactiveClients} Inactivos</span>
          </p>
        </div>

        {/* Tasa de Activos */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
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
          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
            {activeRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${activeRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-slate-500" />
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
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#2dd4bf', fontWeight: 'bold' }}
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ingresos']}
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
    </div>
  );
}
