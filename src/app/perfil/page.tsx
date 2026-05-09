"use client";

import { useState, useEffect, useRef } from "react";
import { User, Activity, Calendar, Clock, Dumbbell, Loader2, Camera, X, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

interface SessionData {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
  sets: {
    weight: number;
    reps: number;
    isCompleted: boolean;
    exercise: {
      name: string;
      muscleGroup: string;
      equipment: string | null;
    };
  }[];
}

interface ProfileData {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  stats: {
    totalWeeklyMinutes: number;
    weeklySessionsCount: number;
    weeklyChartData: { day: string; minutos: number }[];
  };
  monthlyDates: string[];
  recentSessions: SessionData[];
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado grande. El máximo permitido es 2MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch("/api/profile/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String }),
        });

        if (res.ok) {
          await fetchProfileData();
        } else {
          const errorData = await res.json();
          alert(`Error al subir imagen: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Ocurrió un error al subir la imagen.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // getDay(): 0 (Dom) a 6 (Sab). Convertimos a: 0 (Lun) a 6 (Dom)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: currentMonthDays }, (_, i) => i + 1);
  const activeDays = new Set(data.monthlyDates.map(d => new Date(d).getDate()));

  const hoursTrained = Math.floor(data.stats.totalWeeklyMinutes / 60);
  const minsTrained = data.stats.totalWeeklyMinutes % 60;

  const selectedWorkout = data.recentSessions.find(s => s.id === expandedWorkoutId);

  return (
    <DashboardLayout>
      <div className="relative pb-20 -mx-4 sm:-mx-8 -mt-8">
        {/* Header / Cover */}
        <div className="h-40 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 shadow-inner" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative group shadow-lg">
                {data.user.image ? (
                  <img src={data.user.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-slate-400 dark:text-slate-600" />
                )}
                
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleImageUpload}
              />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{data.user.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{data.user.email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            
            {/* Weekly Time Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" /> Tiempo esta semana
              </h2>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{hoursTrained}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-lg">h</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white ml-2">{minsTrained}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-lg">m</span>
              </div>
              
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stats.weeklyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 4 }}
                      contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                      formatter={(val: number) => [`${val} min`, 'Duración']}
                    />
                    <Bar dataKey="minutos" radius={[4, 4, 0, 0]} barSize={24}>
                      {data.stats.weeklyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.minutos > 0 ? '#6366f1' : '#f1f5f9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" /> Actividad del Mes
                </h2>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                  {activeDays.size} sesiones
                </span>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-7 gap-1.5">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 mb-1">{d}</div>
                  ))}
                  
                  {/* Celdas vacías para el desfase del inicio de mes */}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {calendarDays.map(day => (
                    <div 
                      key={day} 
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                        activeDays.has(day) 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none scale-105" 
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* History Feed */}
          <div className="mt-12">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 px-1">
              <Activity className="h-4 w-4 text-indigo-500" /> Entrenamientos Recientes
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {data.recentSessions.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl col-span-full">
                  <Dumbbell className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-400 dark:text-slate-600 font-medium">Aún no hay registros de entrenamiento.</p>
                </div>
              ) : (
                data.recentSessions.map(session => (
                  <div 
                    key={session.id} 
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setExpandedWorkoutId(session.id)}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Dumbbell className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{session.name}</h3>
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(session.date).toLocaleDateString("es-ES", {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                          }).replace(/^\w/, c => c.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-8 border-t border-slate-50 dark:border-slate-800 sm:border-0 pt-4 sm:pt-0 relative z-10">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Duración</p>
                          <p className="font-bold text-slate-900 dark:text-white">{session.durationMinutes} min</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Volumen</p>
                          <p className="font-bold text-slate-900 dark:text-white">{session.totalVolume} kg</p>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <Eye className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pop-up */}
      {selectedWorkout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-2xl">{selectedWorkout.name}</h3>
                <p className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-1">
                  {new Date(selectedWorkout.date).toLocaleDateString("es-ES", {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  }).replace(/^\w/, c => c.toUpperCase())}
                </p>
              </div>
              <button 
                onClick={() => setExpandedWorkoutId(null)}
                className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 rounded-full transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-8 py-6 overflow-y-auto space-y-4 flex-1 scrollbar-hide bg-white dark:bg-slate-900">
              {(() => {
                const setsByExercise: Record<string, typeof selectedWorkout.sets> = {};
                selectedWorkout.sets.forEach(set => {
                  if (!setsByExercise[set.exercise.name]) {
                    setsByExercise[set.exercise.name] = [];
                  }
                  setsByExercise[set.exercise.name].push(set);
                });

                return Object.entries(setsByExercise).map(([exerciseName, sets]) => (
                  <div key={exerciseName} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      {exerciseName}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {sets.map((set, index) => {
                        const isCardio = set.exercise.muscleGroup.toLowerCase() === 'cardio';
                        const isBodyweight = set.exercise.equipment?.toLowerCase() === 'peso corporal';
                        let details = "";
                        
                        if (isCardio) {
                          details = `${set.reps} min`;
                        } else if (isBodyweight) {
                          details = `${set.reps} reps`;
                        } else {
                          details = `${set.weight} kg x ${set.reps}`;
                        }

                        return (
                          <div key={index} className="flex text-sm items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="font-bold text-slate-400 dark:text-slate-500">Set {index + 1}</span>
                            <span className="text-slate-900 dark:text-white font-black">{details}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                {selectedWorkout.durationMinutes} min
              </span>
              <span className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-indigo-500" />
                {selectedWorkout.totalVolume} kg
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
