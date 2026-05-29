"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Loader2, Dumbbell, History, LineChart as LineChartIcon, Info, Accessibility, Target, Activity, BicepsFlexed } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/PreferencesContext";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
}

interface HistorySet {
  id: string;
  weight: number;
  reps: number;
}

interface HistorySession {
  sessionId: string;
  date: string;
  routineName: string;
  sets: HistorySet[];
}

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { weightUnit } = usePreferences();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"indicaciones" | "historial" | "estadisticas">("historial");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, histRes] = await Promise.all([
          fetch(`/api/exercises/${id}`),
          fetch(`/api/exercises/${id}/history`)
        ]);

        if (exRes.ok) {
          const exData = await exRes.json();
          setExercise(exData);
        } else {
          router.push("/gimnasio");
          return;
        }

        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.history);
          setChartData(histData.chartData);
        }
      } catch (error) {
        console.error("Error fetching exercise details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const getExerciseIcon = (equipment: string | null, muscleGroup: string) => {
    const lowerGroup = muscleGroup.toLowerCase();
    const lowerEq = equipment?.toLowerCase() || '';

    if (lowerGroup === 'cardio') return <Activity size={48} className="text-blue-400" />;
    if (lowerEq === 'mancuernas') return <Dumbbell size={48} className="text-amber-400" />;
    if (lowerEq === 'peso corporal') return <Accessibility size={48} className="text-green-400" />;
    if (lowerEq === 'barra' || lowerEq === 'máquina' || lowerEq === 'polea') return <Target size={48} className="text-indigo-400" />;
    
    return <BicepsFlexed size={48} className="text-slate-400" />;
  };

  if (isLoading || !exercise) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 relative">
          <Link
            href="/gimnasio"
            className="absolute top-0 left-0 md:-left-12 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {exercise.imageUrl ? (
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 relative mx-auto md:mx-0 shadow-sm mt-12 md:mt-0">
              <Image 
                src={exercise.imageUrl} 
                alt={exercise.name} 
                fill
                sizes="(max-width: 768px) 128px, 128px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-32 w-32 shrink-0 flex items-center justify-center rounded-2xl bg-slate-800 dark:bg-slate-700 shadow-sm mx-auto md:mx-0 mt-12 md:mt-0">
              {getExerciseIcon(exercise.equipment, exercise.muscleGroup)}
            </div>
          )}
          
          <div className="flex flex-col justify-center text-center md:text-left flex-1 mt-4 md:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {exercise.name}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {exercise.muscleGroup} {exercise.equipment && `• ${exercise.equipment}`}
            </p>
          </div>
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar">
          {[
            { id: "indicaciones", icon: Info, label: "Indicaciones" },
            { id: "historial", icon: History, label: "Historial de Progresión" },
            { id: "estadisticas", icon: LineChartIcon, label: "Estadísticas" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === "indicaciones" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cómo realizar el ejercicio</h3>
              {exercise.description ? (
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {exercise.description}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Info className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-500">No hay indicaciones guardadas para este ejercicio.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "historial" && (
            <div className="space-y-6">
              {history.length > 0 ? (
                history.map((session) => (
                  <div key={session.sessionId} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{session.routineName}</span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {new Date(session.date).toLocaleDateString("es-ES", {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="px-5 py-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="text-slate-400 dark:text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                            <th className="py-2 w-16 text-center">Set</th>
                            <th className="py-2 text-center">{weightUnit === 'lbs' ? 'Lbs' : 'Kg'}</th>
                            <th className="py-2 text-center">Reps</th>
                            <th className="py-2 w-16 text-center">Volumen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {session.sets.map((set, setIndex) => (
                            <tr key={set.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2.5 text-center font-medium text-slate-500 dark:text-slate-400">{setIndex + 1}</td>
                              <td className="py-2.5 text-center font-semibold text-slate-900 dark:text-white">{set.weight}</td>
                              <td className="py-2.5 text-center font-semibold text-slate-900 dark:text-white">{set.reps}</td>
                              <td className="py-2.5 text-center text-slate-500 dark:text-slate-500 text-xs">{set.weight * set.reps} {weightUnit}</td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  <History className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin historial</h3>
                  <p className="text-slate-500 dark:text-slate-500 max-w-sm">Aún no hay registros para este ejercicio.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "estadisticas" && (
            <div className="space-y-6">
              {chartData && chartData.length > 0 ? (
                <>
                  <ChartCard title="Peso máximo" dataKey="pesoMaximo" data={chartData} unit={weightUnit} />
                  <ChartCard title="Repetición máxima (1RM)" dataKey="repeticionMaxima" data={chartData} unit={weightUnit} />
                  <ChartCard title="Volumen de la serie" dataKey="volumenTotal" data={chartData} unit={weightUnit} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <LineChartIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin datos suficientes</h3>
                  <p className="text-slate-500 dark:text-slate-500 max-w-sm">Completa algunos entrenamientos primero.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ChartCard({ title, dataKey, data, unit }: { title: string, dataKey: string, data: any[], unit: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#818cf8' }}
              formatter={(value: any) => [`${value} ${unit}`, title]}
            />
            <Line type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
