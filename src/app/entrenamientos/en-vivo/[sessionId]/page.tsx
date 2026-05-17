"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2, StopCircle, Dumbbell, Clock, Target, Activity, Accessibility, BicepsFlexed, Trophy, X, Plus, Minus, Save, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/PreferencesContext";
import Image from "next/image";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string | null;
  imageUrl?: string | null;
}

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isCompleted: boolean;
  exercise: Exercise;
}

interface WorkoutSession {
  id: string;
  routineId: string;
  startTime: string;
  endTime: string | null;
  workoutSets: WorkoutSet[];
  routine?: { name: string };
  exerciseHistoryMap?: Record<string, { weight: number, reps: number }[]>;
  exerciseAllTimeRecordsMap?: Record<string, { maxWeight: number, max1RM: number, maxVolume: number }>;
}

export default function LiveWorkoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { data: authSession } = useSession();
  const { sessionId } = use(params);
  const { weightUnit, distanceUnit } = usePreferences();
  const { showConfirm } = useCustomAlert();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState("00:00");
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Ruedita states
  const [editedHours, setEditedHours] = useState(0);
  const [editedMinutes, setEditedMinutes] = useState(0);
  const [editedSeconds, setEditedSeconds] = useState(0);

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLDivElement>(null);

  const getExerciseIcon = (equipment: string | null | undefined, muscleGroup: string) => {
    const lowerGroup = muscleGroup.toLowerCase();
    const lowerEq = equipment?.toLowerCase() || "";

    if (lowerGroup === "cardio") return <Activity size={16} className="text-secondary dark:text-blue-400" />;
    if (lowerEq === "mancuernas") return <Dumbbell size={16} className="text-amber-600 dark:text-amber-400" />;
    if (lowerEq === "peso corporal") return <Accessibility size={16} className="text-green-600 dark:text-green-400" />;
    if (lowerEq === "barra" || lowerEq === "máquina" || lowerEq === "polea") return <Target size={16} className="text-primary dark:text-cyan-400" />;
    
    return <BicepsFlexed size={16} className="text-slate-600 dark:text-slate-400" />;
  };

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        router.push("/entrenamientos");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session?.startTime || session.endTime) return;
    
    const start = new Date(session.startTime).getTime();
    
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      if (hours > 0) {
        setTimeElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer(); // Ejecutar inmediatamente para evitar parpadeo inicial en 00:00
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.startTime, session?.endTime]);

  const handleUpdateSet = async (setId: string, reps: number, weight: number, isCompleted: boolean) => {
    try {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          workoutSets: prev.workoutSets.map((s) => 
            s.id === setId ? { ...s, reps, weight, isCompleted } : s
          ),
        };
      });
      await fetch(`/api/sessions/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps, weight, isCompleted }),
      });
    } catch (error) {
      console.error("Error updating set:", error);
      fetchSession();
    }
  };

  const handleFinishWorkoutClick = () => {
    if (!session) return;
    const start = new Date(session.startTime).getTime();
    const elapsedSec = Math.max(1, Math.round((Date.now() - start) / 1000));
    const h = Math.floor(elapsedSec / 3600);
    const m = Math.floor((elapsedSec % 3600) / 60);
    const s = elapsedSec % 60;
    setEditedHours(h);
    setEditedMinutes(m);
    setEditedSeconds(s);
    setShowSummary(true);
  };

  useEffect(() => {
    if (showSummary) {
      setTimeout(() => {
        const itemHeight = 40; // Altura de cada item de la rueda (40px)
        if (hoursRef.current) hoursRef.current.scrollTop = editedHours * itemHeight;
        if (minutesRef.current) minutesRef.current.scrollTop = editedMinutes * itemHeight;
        if (secondsRef.current) secondsRef.current.scrollTop = editedSeconds * itemHeight;
      }, 100);
    }
  }, [showSummary]);

  const handleScrollWheel = (e: React.UIEvent<HTMLDivElement>, type: 'h' | 'm' | 's') => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const itemHeight = 40;
    const index = Math.round(scrollTop / itemHeight);
    
    if (type === 'h') {
      const val = Math.min(23, Math.max(0, index));
      if (val !== editedHours) setEditedHours(val);
    } else if (type === 'm') {
      const val = Math.min(59, Math.max(0, index));
      if (val !== editedMinutes) setEditedMinutes(val);
    } else if (type === 's') {
      const val = Math.min(59, Math.max(0, index));
      if (val !== editedSeconds) setEditedSeconds(val);
    }
  };

  const handleSaveWorkout = async () => {
    if (!session) return;
    setIsFinishing(true);
    try {
      const uncompletedSetsWithData = session.workoutSets.filter(s => !s.isCompleted && (s.reps > 0 || s.weight > 0)) || [];
      if (uncompletedSetsWithData.length > 0) {
        await Promise.all(uncompletedSetsWithData.map(s => 
          fetch(`/api/sessions/sets/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reps: s.reps, weight: s.weight, isCompleted: true }),
          })
        ));
      }

      // Calcular custom endTime basado en horas, minutos y segundos de la ruedita
      const totalSeconds = (editedHours * 3600) + (editedMinutes * 60) + editedSeconds;
      const customEndTime = new Date(new Date(session.startTime).getTime() + totalSeconds * 1000).toISOString();

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTime: customEndTime }),
      });
      if (res.ok) router.push("/dashboard");
    } catch (error) {
      console.error("Error finishing workout:", error);
      setIsFinishing(false);
    }
  };

  const handleDiscardWorkout = () => {
    showConfirm("¿Estás seguro de que quieres descartar este entrenamiento? No se guardará ninguna serie en tu historial.", () => {
      router.push("/dashboard");
    });
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Total Volume
  const completedSets = session.workoutSets.filter(s => s.isCompleted);
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

  // 2. Records achieved in this session
  const recordsInSessionMap: Record<string, { type: string; value: number }[]> = {};
  
  session.workoutSets.forEach(set => {
    if (!set.isCompleted) return;
    const currentWeight = set.weight;
    const currentReps = set.reps;
    const currentVolume = currentWeight * currentReps;
    const current1RM = currentReps === 0 ? 0 : (currentReps === 1 ? currentWeight : currentWeight * (1 + currentReps / 30));

    const allTimeRecords = session.exerciseAllTimeRecordsMap?.[set.exercise.id];
    if (allTimeRecords) {
      if (!recordsInSessionMap[set.exercise.name]) {
        recordsInSessionMap[set.exercise.name] = [];
      }

      if (allTimeRecords.maxWeight > 0 && currentWeight > allTimeRecords.maxWeight) {
        const existing = recordsInSessionMap[set.exercise.name].find(r => r.type === "Peso Máximo");
        if (!existing || currentWeight > existing.value) {
          if (existing) existing.value = currentWeight;
          else recordsInSessionMap[set.exercise.name].push({ type: "Peso Máximo", value: currentWeight });
        }
      }
      
      const new1RMVal = Math.round(current1RM * 10) / 10;
      if (allTimeRecords.max1RM > 0 && new1RMVal > allTimeRecords.max1RM) {
        const existing = recordsInSessionMap[set.exercise.name].find(r => r.type === "Mejor 1RM");
        if (!existing || new1RMVal > existing.value) {
          if (existing) existing.value = new1RMVal;
          else recordsInSessionMap[set.exercise.name].push({ type: "Mejor 1RM", value: new1RMVal });
        }
      }

      if (allTimeRecords.maxVolume > 0 && currentVolume > allTimeRecords.maxVolume) {
        const existing = recordsInSessionMap[set.exercise.name].find(r => r.type === "Mayor Volumen");
        if (!existing || currentVolume > existing.value) {
          if (existing) existing.value = currentVolume;
          else recordsInSessionMap[set.exercise.name].push({ type: "Mayor Volumen", value: currentVolume });
        }
      }
    }
  });

  const flatRecords: { exerciseName: string; type: string; value: number }[] = [];
  Object.entries(recordsInSessionMap).forEach(([exerciseName, list]) => {
    list.forEach(r => {
      flatRecords.push({ exerciseName, type: r.type, value: r.value });
    });
  });

  const groupedSets: Record<string, { exercise: Exercise; sets: WorkoutSet[] }> = {};
  session.workoutSets.forEach((set) => {
    if (!groupedSets[set.exercise.id]) {
      groupedSets[set.exercise.id] = { exercise: set.exercise, sets: [] };
    }
    groupedSets[set.exercise.id].sets.push(set);
  });

  if (showSummary) {
    return (
      <div className="min-h-screen bg-slate-900 text-white pb-24 transition-colors">
        {/* Sticky top header */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <button 
              onClick={() => setShowSummary(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-extrabold text-lg flex-1">Resumen del Entrenamiento</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Trophy Header Banner */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20 rounded-3xl p-6 text-center shadow-[0_0_20px_rgba(245,158,11,0.05)] animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex bg-amber-500/20 p-4 rounded-full text-amber-400 mb-3 border border-amber-500/30">
              <Trophy className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent leading-none">
              ¡ENTRENAMIENTO COMPLETADO!
            </h2>
            <p className="text-xs text-slate-400 mt-2 font-medium">Increíble trabajo hoy. Revisa tus estadísticas y guarda tu esfuerzo.</p>
          </div>

          {/* Stats Cards Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Volume */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volumen Total</span>
              <span className="text-2xl font-black text-white mt-1">{totalVolume} <span className="text-sm font-semibold text-slate-400">{weightUnit}</span></span>
            </div>

            {/* Completed Sets count */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Series Completadas</span>
              <span className="text-2xl font-black text-white mt-1">{completedSets.length} <span className="text-sm font-semibold text-slate-400">sets</span></span>
            </div>
          </div>

          {/* Editable Duration Section (Ruedita Rueda Scroll) */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 bg-slate-900/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center mb-4 select-none">
              Duración del Entrenamiento
            </span>
            
            <div className="max-w-[280px] mx-auto space-y-2">
              {/* Column labels at the top, perfectly aligned */}
              <div className="flex justify-center items-center text-center select-none">
                <span className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horas</span>
                <div className="w-4" />
                <span className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutos</span>
                <div className="w-4" />
                <span className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Segundos</span>
              </div>

              {/* Scroll wheels container */}
              <div className="relative flex justify-center items-center h-[120px] overflow-hidden bg-slate-950/20 rounded-2xl border border-slate-800/60 px-2">
                {/* Highlight selection bar in the center */}
                <div className="absolute left-2 right-2 top-[40px] h-[40px] pointer-events-none border-y border-cyan-500/20 bg-cyan-500/5 rounded-lg z-20" />

                {/* Gradient masks to fade out top/bottom items */}
                <div className="absolute top-0 left-0 right-0 h-[30px] bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-[30px] bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10" />

                {/* Hours Column */}
                <div 
                  ref={hoursRef}
                  onScroll={(e) => handleScrollWheel(e, 'h')}
                  className="flex-1 h-[120px] overflow-y-auto snap-y snap-mandatory scroll-smooth text-center select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="h-10 shrink-0" />
                  {Array.from({ length: 24 }, (_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-10 flex items-center justify-center snap-center text-lg transition-all duration-150",
                        editedHours === i 
                          ? "text-cyan-400 font-black scale-110 text-xl" 
                          : "text-slate-500 font-bold opacity-45"
                      )}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="h-10 shrink-0" />
                </div>

                <div className="w-4 text-center text-xl font-black text-cyan-500/30 select-none pb-0.5">:</div>

                {/* Minutes Column */}
                <div 
                  ref={minutesRef}
                  onScroll={(e) => handleScrollWheel(e, 'm')}
                  className="flex-1 h-[120px] overflow-y-auto snap-y snap-mandatory scroll-smooth text-center select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="h-10 shrink-0" />
                  {Array.from({ length: 60 }, (_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-10 flex items-center justify-center snap-center text-lg transition-all duration-150",
                        editedMinutes === i 
                          ? "text-cyan-400 font-black scale-110 text-xl" 
                          : "text-slate-500 font-bold opacity-45"
                      )}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="h-10 shrink-0" />
                </div>

                <div className="w-4 text-center text-xl font-black text-cyan-500/30 select-none pb-0.5">:</div>

                {/* Seconds Column */}
                <div 
                  ref={secondsRef}
                  onScroll={(e) => handleScrollWheel(e, 's')}
                  className="flex-1 h-[120px] overflow-y-auto snap-y snap-mandatory scroll-smooth text-center select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="h-10 shrink-0" />
                  {Array.from({ length: 60 }, (_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-10 flex items-center justify-center snap-center text-lg transition-all duration-150",
                        editedSeconds === i 
                          ? "text-cyan-400 font-black scale-110 text-xl" 
                          : "text-slate-500 font-bold opacity-45"
                      )}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="h-10 shrink-0" />
                </div>
              </div>
            </div>

            {/* Total Duration Readout */}
            <div className="text-center mt-4">
              <span className="text-xs font-bold text-slate-400">Duración editada: </span>
              <span className="text-sm font-black text-white">
                {String(editedHours).padStart(2, '0')}:{String(editedMinutes).padStart(2, '0')}:{String(editedSeconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Personal Records Broken Section */}
          {flatRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>🏆 Récords Personales superados</span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              </h3>
              <div className="space-y-2">
                {flatRecords.map((rec, i) => (
                  <div key={i} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-xs font-black text-white">{rec.exerciseName}</p>
                      <p className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">{rec.type}</p>
                    </div>
                    <div className="bg-amber-500/20 text-amber-300 font-extrabold text-sm px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
                      <span>🔥 {rec.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises and Sets completed list */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Ejercicios y Series Realizadas</h3>
            <div className="space-y-3">
              {Object.values(groupedSets).map(({ exercise, sets }, idx) => {
                const completedSetsInThisExercise = sets.filter(s => s.isCompleted);
                if (completedSetsInThisExercise.length === 0) return null;
                
                return (
                  <div key={exercise.id} className="bg-slate-800/25 border border-slate-800/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 border border-slate-700">
                        {idx + 1}
                      </div>
                      <h4 className="font-bold text-white text-base flex-1">{exercise.name}</h4>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 space-y-1.5">
                      {completedSetsInThisExercise.map((set, sIndex) => (
                        <div key={set.id} className="flex items-center justify-between text-sm px-2 py-1 rounded-xl hover:bg-slate-800/30">
                          <span className="font-semibold text-slate-400">Serie {sIndex + 1}</span>
                          <span className="font-black text-slate-200">
                            {set.exercise.equipment?.toLowerCase() === 'peso corporal' 
                              ? `${set.reps} reps`
                              : `${set.weight} ${weightUnit} x ${set.reps} reps`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Grid Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSaveWorkout}
              disabled={isFinishing}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-2xl text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isFinishing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Entrenamiento
                </>
              )}
            </button>

            <button
              onClick={() => setShowSummary(false)}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-2xl text-base border border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              Volver a Editar Series
            </button>

            <button
              onClick={handleDiscardWorkout}
              className="w-full py-3 hover:bg-red-500/10 text-red-400 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Descartar Entrenamiento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors">
      <div className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-950 border-b dark:border-slate-800 text-white shadow-soft px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="font-bold text-lg leading-tight line-clamp-1">{session.routine?.name || "Entrenamiento Libre"}</h1>
            <div className="flex items-center gap-1.5 text-cyan-300 dark:text-cyan-400 text-sm font-medium mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeElapsed}</span>
            </div>
          </div>
          <button
            onClick={handleFinishWorkoutClick}
            disabled={isFinishing}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-2xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-70"
          >
            {isFinishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
            Terminar
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {Object.values(groupedSets).map(({ exercise, sets }, index) => (
          <div key={exercise.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                {exercise.imageUrl ? (
                  <Image src={exercise.imageUrl} alt={exercise.name} fill className="object-cover" />
                ) : (
                  getExerciseIcon(exercise.equipment, exercise.muscleGroup)
                )}
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">{index + 1}. {exercise.name}</h2>
            </div>
            
            <div className="p-2 space-y-1">
              <div className="flex px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <div className="w-12 text-center">Set</div>
                {exercise.muscleGroup.toLowerCase() === 'cardio' ? (
                  <>
                    <div className="flex-1 text-center">{distanceUnit}</div>
                    <div className="flex-1 text-center">Minutos</div>
                  </>
                ) : exercise.equipment?.toLowerCase() === 'peso corporal' ? (
                  <div className="flex-1 text-center">Reps</div>
                ) : (
                  <>
                    <div className="flex-1 text-center">{weightUnit}</div>
                    <div className="flex-1 text-center">Reps</div>
                  </>
                )}
                <div className="w-14 text-center"><Check className="h-4 w-4 mx-auto" /></div>
              </div>

              {sets.map((set, setIndex) => (
                <SetRow 
                  key={set.id} 
                  set={set} 
                  index={setIndex} 
                  historicalSet={session.exerciseHistoryMap?.[exercise.id]?.[setIndex]}
                  allTimeRecords={session.exerciseAllTimeRecordsMap?.[exercise.id]}
                  onUpdate={handleUpdateSet}
                  onShowRecord={(recordData: any) => setActiveRecord(recordData)}
                  weightUnit={weightUnit}
                  distanceUnit={distanceUnit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Récords Personales Modal Overlay */}
      {activeRecord && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/40 shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden text-center p-6 animate-in zoom-in-95 duration-200 text-white">
            {/* Absolute Close Button */}
            <button 
              onClick={() => setActiveRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing Trophy */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="relative bg-amber-500/10 border border-amber-500/30 p-4.5 rounded-full text-amber-400">
                  <Trophy className="h-9 w-9 animate-bounce" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              ¡NUEVO RÉCORD PERSONAL!
            </h3>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">{activeRecord.exerciseName}</p>

            <div className="mt-5 space-y-3.5 text-left">
              {activeRecord.brokeWeight && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Peso Máximo</p>
                    <p className="text-xs text-slate-400 mt-0.5">Anterior: {activeRecord.oldWeight} {weightUnit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{activeRecord.weight} {weightUnit}</p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">¡Superado! (+{Math.round((activeRecord.weight - activeRecord.oldWeight)*10)/10})</p>
                  </div>
                </div>
              )}

              {activeRecord.broke1RM && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">Mejor 1RM Estimado</p>
                    <p className="text-xs text-slate-400 mt-0.5">Anterior: {activeRecord.old1RM} {weightUnit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{activeRecord.new1RM} {weightUnit}</p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">¡Superado! (+{Math.round((activeRecord.new1RM - activeRecord.old1RM)*10)/10})</p>
                  </div>
                </div>
              )}

              {activeRecord.brokeVolume && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-violet-400 font-black uppercase tracking-wider">Mayor Volumen de Serie</p>
                    <p className="text-xs text-slate-400 mt-0.5">Anterior: {activeRecord.oldVolume} {weightUnit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{activeRecord.newVolume} {weightUnit}</p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">¡Superado! (+{activeRecord.newVolume - activeRecord.oldVolume})</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveRecord(null)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              ¡Seguir Entrenando!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SetRow({ set, index, historicalSet, allTimeRecords, onUpdate, onShowRecord, weightUnit, distanceUnit }: any) {
  const [reps, setReps] = useState(set.reps === 0 ? "" : set.reps.toString());
  const [weight, setWeight] = useState(set.weight === 0 ? "" : set.weight.toString());
  const isCardio = set.exercise.muscleGroup.toLowerCase() === 'cardio';
  const isBodyweight = set.exercise.equipment?.toLowerCase() === 'peso corporal';

  const currentWeight = Number(weight) || 0;
  const currentReps = Number(reps) || 0;
  const currentVolume = currentWeight * currentReps;
  const current1RM = currentReps === 0 ? 0 : (currentReps === 1 ? currentWeight : currentWeight * (1 + currentReps / 30));

  const brokeWeight = set.isCompleted && allTimeRecords && allTimeRecords.maxWeight > 0 && currentWeight > allTimeRecords.maxWeight;
  const broke1RM = set.isCompleted && allTimeRecords && allTimeRecords.max1RM > 0 && current1RM > allTimeRecords.max1RM;
  const brokeVolume = set.isCompleted && allTimeRecords && allTimeRecords.maxVolume > 0 && currentVolume > allTimeRecords.maxVolume;

  const isRecord = brokeWeight || broke1RM || brokeVolume;

  const handleShowRecordDetails = () => {
    if (!isRecord) return;
    onShowRecord({
      exerciseName: set.exercise.name,
      brokeWeight,
      broke1RM,
      brokeVolume,
      weight: currentWeight,
      reps: currentReps,
      oldWeight: allTimeRecords.maxWeight,
      old1RM: allTimeRecords.max1RM,
      oldVolume: allTimeRecords.maxVolume,
      new1RM: Math.round(current1RM * 10) / 10,
      newVolume: currentVolume,
    });
  };

  const handleToggleComplete = () => {
    let numReps = Number(reps);
    let numWeight = Number(weight);
    if (!set.isCompleted) {
      if (reps === "" && historicalSet?.reps !== undefined) { numReps = historicalSet.reps; setReps(numReps.toString()); }
      if (weight === "" && historicalSet?.weight !== undefined) { numWeight = historicalSet.weight; setWeight(numWeight.toString()); }
    }
    onUpdate(set.id, numReps || 0, numWeight || 0, !set.isCompleted);
  };

  const handleBlur = () => {
    const numReps = Number(reps) || 0;
    const numWeight = Number(weight) || 0;
    if (numReps !== set.reps || numWeight !== set.weight) onUpdate(set.id, numReps, numWeight, set.isCompleted);
  };

  const placeholderWeight = historicalSet?.weight !== undefined ? historicalSet.weight.toString() : (isCardio ? (distanceUnit === 'mi' ? 'Mi' : 'Km') : (weightUnit === 'lbs' ? 'Lbs' : 'Kg'));
  const placeholderReps = historicalSet?.reps !== undefined ? historicalSet.reps.toString() : (isCardio ? "Minutos" : "Reps");

  return (
    <div className={cn(
      "flex items-center px-2 py-2 rounded-3xl transition-colors",
      set.isCompleted 
        ? "bg-emerald-50 dark:bg-emerald-950/40" 
        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
    )}>
      <div className="w-12 flex items-center justify-center select-none shrink-0">
        <span className="font-semibold text-slate-500 dark:text-slate-500 text-sm">{index + 1}</span>
      </div>
      {!isBodyweight && (
        <div className="flex-1 px-1">
          <input
            type="number"
            min="0"
            step={isCardio ? "0.01" : "1"}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={handleBlur}
            disabled={set.isCompleted}
            placeholder={placeholderWeight}
            className={cn(
              "w-full text-center py-2.5 rounded-2xl border focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors text-base font-semibold",
              set.isCompleted 
                ? "bg-transparent border-transparent text-emerald-700 dark:text-emerald-400" 
                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
            )}
          />
        </div>
      )}
      <div className="flex-1 px-1">
        <input
          type="number"
          min="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
          disabled={set.isCompleted}
          placeholder={placeholderReps}
          className={cn(
            "w-full text-center py-2.5 rounded-2xl border focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors text-base font-semibold",
            set.isCompleted 
              ? "bg-transparent border-transparent text-emerald-700 dark:text-emerald-400" 
              : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
          )}
        />
      </div>
      <div className="flex items-center justify-end gap-1.5 shrink-0 pl-1 pr-2 min-w-[56px]">
        {isRecord && (
          <button
            onClick={handleShowRecordDetails}
            className="h-10 w-10 flex items-center justify-center rounded-3xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-lg shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse active:scale-90 transition-all cursor-pointer shrink-0"
            title="Ver récord personal"
          >
            🔥
          </button>
        )}
        <button
          onClick={handleToggleComplete}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-3xl transition-all shadow-sm active:scale-95 shrink-0",
            set.isCompleted 
              ? "bg-emerald-500 text-white" 
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
          )}
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
