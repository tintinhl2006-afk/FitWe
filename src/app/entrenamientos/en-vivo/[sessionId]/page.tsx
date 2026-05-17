"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2, StopCircle, Dumbbell, Clock, Target, Activity, Accessibility, BicepsFlexed } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/PreferencesContext";
import Image from "next/image";

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
}

export default function LiveWorkoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { data: authSession } = useSession();
  const { sessionId } = use(params);
  const { weightUnit, distanceUnit } = usePreferences();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState("00:00");
  const [sessionLoadedAt] = useState(Date.now());

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
    const interval = setInterval(() => {
      const now = authSession?.user?.serverNow 
        ? new Date(authSession.user.serverNow).getTime() + (Date.now() - sessionLoadedAt)
        : new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      if (hours > 0) {
        setTimeElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session, authSession, sessionLoadedAt]);

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

  const handleFinishWorkout = async () => {
    if (!window.confirm("¿Terminar el entrenamiento y guardar sesión?")) return;
    setIsFinishing(true);
    try {
      const uncompletedSetsWithData = session?.workoutSets.filter(s => !s.isCompleted && (s.reps > 0 || s.weight > 0)) || [];
      if (uncompletedSetsWithData.length > 0) {
        await Promise.all(uncompletedSetsWithData.map(s => 
          fetch(`/api/sessions/sets/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reps: s.reps, weight: s.weight, isCompleted: true }),
          })
        ));
      }
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endTime: authSession?.user?.serverNow 
            ? new Date(authSession.user.serverNow).toISOString() 
            : new Date().toISOString() 
        }),
      });
      if (res.ok) router.push("/dashboard");
    } catch (error) {
      console.error("Error finishing workout:", error);
      setIsFinishing(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const groupedSets: Record<string, { exercise: Exercise; sets: WorkoutSet[] }> = {};
  session.workoutSets.forEach((set) => {
    if (!groupedSets[set.exercise.id]) {
      groupedSets[set.exercise.id] = { exercise: set.exercise, sets: [] };
    }
    groupedSets[set.exercise.id].sets.push(set);
  });

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
            onClick={handleFinishWorkout}
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
                  onUpdate={handleUpdateSet}
                  weightUnit={weightUnit}
                  distanceUnit={distanceUnit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetRow({ set, index, historicalSet, onUpdate, weightUnit, distanceUnit }: any) {
  const [reps, setReps] = useState(set.reps === 0 ? "" : set.reps.toString());
  const [weight, setWeight] = useState(set.weight === 0 ? "" : set.weight.toString());
  const isCardio = set.exercise.muscleGroup.toLowerCase() === 'cardio';
  const isBodyweight = set.exercise.equipment?.toLowerCase() === 'peso corporal';

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
      <div className="w-12 text-center font-medium text-slate-500 dark:text-slate-500">{index + 1}</div>
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
      <div className="w-14 flex justify-center">
        <button
          onClick={handleToggleComplete}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-3xl transition-all shadow-sm active:scale-95",
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
