import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  ChevronDown,
  Clock,
  Trophy,
  Save,
  ArrowLeft,
  Trash2,
  X,
  Flame,
  Plus,
  Search,
  MoreVertical,
  ArrowUpDown,
  Repeat,
  Timer,
  GripVertical,
} from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useLiveWorkout } from '../../context/LiveWorkoutContext';
import { Palette } from '../../constants/theme';
import { api } from '../../lib/apiClient';
import { ExerciseAvatar } from './ExerciseAvatar';

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
  notes?: string | null;
  exercise: Exercise;
}

interface AllTimeRecord {
  maxWeight: number;
  max1RM: number;
  maxVolume: number;
}

interface ActiveRecord {
  exerciseName: string;
  brokeWeight: boolean;
  broke1RM: boolean;
  brokeVolume: boolean;
  weight: number;
  oldWeight: number;
  old1RM: number;
  oldVolume: number;
  new1RM: number;
  newVolume: number;
}

interface RoutineExerciseRef {
  id: string;
  exerciseId: string;
  sets: number;
}

interface HistoricalSet {
  weight: number;
  reps: number;
}

interface WorkoutSession {
  id: string;
  routineId: string;
  startTime: string;
  endTime: string | null;
  workoutSets: WorkoutSet[];
  routine?: { name: string; exercises?: RoutineExerciseRef[] };
  exerciseAllTimeRecordsMap?: Record<string, AllTimeRecord>;
  exerciseHistoryMap?: Record<string, HistoricalSet[]>;
}

const REST_OPTIONS = [0, 30, 60, 90, 120];
const REORDER_ROW_HEIGHT = 64;

const LBS_PER_KG = 2.20462;

/** Weight is always stored/synced in the account's global weightUnit (see
 * /api/settings/units, which bulk-converts every stored WorkoutSet weight when that
 * preference changes) — a per-exercise display override here is purely visual. */
function convertWeightValue(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to || value === 0) return value;
  return from === 'kg' ? value * LBS_PER_KG : value / LBS_PER_KG;
}

function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function LiveWorkoutOverlay({ sessionId }: { sessionId: string }) {
  const { colors, theme } = useAppTheme();
  const { weightUnit, distanceUnit } = usePreferences();
  const { minimize, endSession } = useLiveWorkout();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [showSummary, setShowSummary] = useState(false);
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null);
  const [editedHours, setEditedHours] = useState(0);
  const [editedMinutes, setEditedMinutes] = useState(0);
  const [editedSeconds, setEditedSeconds] = useState(0);

  const [addingSetForExerciseId, setAddingSetForExerciseId] = useState<string | null>(null);
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [showRoutineSyncPrompt, setShowRoutineSyncPrompt] = useState(false);
  const [isSyncingRoutine, setIsSyncingRoutine] = useState(false);

  const [menuForExerciseId, setMenuForExerciseId] = useState<string | null>(null);
  const [exerciseOrder, setExerciseOrder] = useState<string[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderDraft, setReorderDraft] = useState<string[]>([]);
  const [replaceTargetExerciseId, setReplaceTargetExerciseId] = useState<string | null>(null);
  const [isReplacingExercise, setIsReplacingExercise] = useState(false);
  const [removingExerciseId, setRemovingExerciseId] = useState<string | null>(null);

  // Per-exercise rest duration (seconds; 0 = off), kept client-side only for this session.
  const [restDurations, setRestDurations] = useState<Record<string, number>>({});
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);

  // Per-exercise display-only weight unit override (kg/lbs). Absent = follow the
  // account's global weightUnit preference. Client-side only, reset each session.
  const [weightUnitOverrides, setWeightUnitOverrides] = useState<Record<string, 'kg' | 'lbs'>>({});
  const [unitPickerExerciseId, setUnitPickerExerciseId] = useState<string | null>(null);

  async function fetchSession() {
    try {
      const data = await api.get(`/api/sessions/${sessionId}`);
      setSession(data);
    } catch {
      endSession();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session?.startTime || session.endTime || showSummary) return;
    const start = new Date(session.startTime).getTime();

    function updateTimer() {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setTimeElapsed(
        hours > 0
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.startTime, session?.endTime, showSummary]);

  useEffect(() => {
    if (restSecondsLeft === null) return;
    if (restSecondsLeft <= 0) {
      setRestSecondsLeft(null);
      return;
    }
    const t = setTimeout(() => setRestSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [restSecondsLeft]);

  async function handleUpdateSet(setId: string, reps: number, weight: number, isCompleted: boolean, exerciseId: string) {
    const wasCompleted = session?.workoutSets.find((s) => s.id === setId)?.isCompleted;
    setSession((prev) =>
      prev ? { ...prev, workoutSets: prev.workoutSets.map((s) => (s.id === setId ? { ...s, reps, weight, isCompleted } : s)) } : prev
    );
    if (isCompleted && !wasCompleted) {
      const rest = restDurations[exerciseId] || 0;
      if (rest > 0) setRestSecondsLeft(rest);
    }
    try {
      await api.patch(`/api/sessions/sets/${setId}`, { reps, weight, isCompleted });
    } catch {
      fetchSession();
    }
  }

  async function handleAddSet(exercise: Exercise) {
    if (!session) return;
    setAddingSetForExerciseId(exercise.id);
    try {
      const setsForExercise = session.workoutSets.filter((s) => s.exercise.id === exercise.id);
      const lastSet = setsForExercise[setsForExercise.length - 1];
      const newSet = await api.post(`/api/sessions/${sessionId}/sets`, {
        exerciseId: exercise.id,
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 0,
      });
      setSession((prev) => (prev ? { ...prev, workoutSets: [...prev.workoutSets, newSet] } : prev));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo añadir la serie.');
    } finally {
      setAddingSetForExerciseId(null);
    }
  }

  function openExercisePicker() {
    setReplaceTargetExerciseId(null);
    setPickerSearch('');
    setIsPickerOpen(true);
    if (exerciseCatalog.length === 0) {
      api
        .get('/api/exercises')
        .then((data) => setExerciseCatalog(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  async function handleAddExercise(exercise: Exercise) {
    if (!session) return;
    setIsAddingExercise(true);
    try {
      const setCount = exercise.muscleGroup.toLowerCase() === 'cardio' ? 1 : 3;
      for (let i = 0; i < setCount; i++) {
        const created: WorkoutSet = await api.post(`/api/sessions/${sessionId}/sets`, { exerciseId: exercise.id, weight: 0, reps: 0 });
        setSession((prev) => (prev ? { ...prev, workoutSets: [...prev.workoutSets, created] } : prev));
      }
      setIsPickerOpen(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo añadir el ejercicio.');
    } finally {
      setIsAddingExercise(false);
    }
  }

  function openReplacePicker(exerciseId: string) {
    setMenuForExerciseId(null);
    setReplaceTargetExerciseId(exerciseId);
    setPickerSearch('');
    setIsPickerOpen(true);
    if (exerciseCatalog.length === 0) {
      api
        .get('/api/exercises')
        .then((data) => setExerciseCatalog(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  async function handleReplaceExercise(newExercise: Exercise) {
    if (!session || !replaceTargetExerciseId) return;
    const oldExerciseId = replaceTargetExerciseId;
    setIsReplacingExercise(true);
    try {
      await api.patch(`/api/sessions/${sessionId}/exercises/${oldExerciseId}`, { newExerciseId: newExercise.id });
      setSession((prev) =>
        prev
          ? { ...prev, workoutSets: prev.workoutSets.map((s) => (s.exercise.id === oldExerciseId ? { ...s, exercise: newExercise } : s)) }
          : prev
      );
      setExerciseOrder((prev) => (prev ? prev.map((id) => (id === oldExerciseId ? newExercise.id : id)) : prev));
      setIsPickerOpen(false);
      setReplaceTargetExerciseId(null);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reemplazar el ejercicio.');
    } finally {
      setIsReplacingExercise(false);
    }
  }

  function handleRemoveExercise(exerciseId: string, exerciseName: string) {
    setMenuForExerciseId(null);
    Alert.alert('Eliminar Ejercicio', `¿Seguro que quieres quitar "${exerciseName}" de este entrenamiento?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!session) return;
          setRemovingExerciseId(exerciseId);
          try {
            await api.delete(`/api/sessions/${sessionId}/exercises/${exerciseId}`);
            setSession((prev) => (prev ? { ...prev, workoutSets: prev.workoutSets.filter((s) => s.exercise.id !== exerciseId) } : prev));
            setExerciseOrder((prev) => (prev ? prev.filter((id) => id !== exerciseId) : prev));
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar el ejercicio.');
          } finally {
            setRemovingExerciseId(null);
          }
        },
      },
    ]);
  }

  function startReorder(orderedIds: string[]) {
    setMenuForExerciseId(null);
    setReorderDraft(orderedIds);
    setIsReordering(true);
  }

  function handleReorderDragMove(exerciseId: string, targetIndex: number) {
    setReorderDraft((prev) => {
      const currentIndex = prev.findIndex((id) => id === exerciseId);
      if (currentIndex === -1) return prev;
      const clamped = Math.max(0, Math.min(prev.length - 1, targetIndex));
      if (clamped === currentIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(clamped, 0, moved);
      return next;
    });
  }

  function confirmReorder() {
    setExerciseOrder(reorderDraft);
    setIsReordering(false);
  }

  function cycleRestDuration(exerciseId: string) {
    setRestDurations((prev) => {
      const current = prev[exerciseId] || 0;
      const idx = REST_OPTIONS.indexOf(current);
      const next = REST_OPTIONS[(idx + 1) % REST_OPTIONS.length];
      return { ...prev, [exerciseId]: next };
    });
  }

  async function handleSaveNotes(exerciseId: string, notes: string) {
    setSession((prev) =>
      prev ? { ...prev, workoutSets: prev.workoutSets.map((s) => (s.exercise.id === exerciseId ? { ...s, notes } : s)) } : prev
    );
    try {
      await api.patch(`/api/sessions/${sessionId}/exercises/${exerciseId}`, { notes });
    } catch {
      // Best-effort: notes are a convenience field, not worth interrupting the workout for.
    }
  }

  /** Any exercise/set count added live beyond what the routine originally specified. */
  function getRoutineDiff() {
    if (!session?.routineId || !session.routine?.exercises) return null;
    const routineSetCounts = new Map(session.routine.exercises.map((re) => [re.exerciseId, re]));
    const sessionSetCounts = new Map<string, number>();
    session.workoutSets.forEach((s) => {
      sessionSetCounts.set(s.exercise.id, (sessionSetCounts.get(s.exercise.id) || 0) + 1);
    });

    const newExerciseIds: string[] = [];
    const increasedSetExerciseIds: string[] = [];
    sessionSetCounts.forEach((count, exerciseId) => {
      const re = routineSetCounts.get(exerciseId);
      if (!re) newExerciseIds.push(exerciseId);
      else if (count > re.sets) increasedSetExerciseIds.push(exerciseId);
    });

    if (newExerciseIds.length === 0 && increasedSetExerciseIds.length === 0) return null;
    return { newExerciseIds, increasedSetExerciseIds, sessionSetCounts, routineSetCounts };
  }

  async function syncRoutineWithSession() {
    const diff = getRoutineDiff();
    if (!diff || !session?.routineId) return;
    setIsSyncingRoutine(true);
    try {
      for (const exerciseId of diff.increasedSetExerciseIds) {
        const re = diff.routineSetCounts.get(exerciseId)!;
        const newCount = diff.sessionSetCounts.get(exerciseId)!;
        await api.patch(`/api/routines/${session.routineId}/exercises/${re.id}`, { sets: newCount });
      }
      for (const exerciseId of diff.newExerciseIds) {
        const setsForExercise = session.workoutSets.filter((s) => s.exercise.id === exerciseId);
        const reps = setsForExercise.find((s) => s.reps > 0)?.reps || 10;
        await api.post(`/api/routines/${session.routineId}/exercises`, {
          exerciseId,
          sets: setsForExercise.length,
          reps,
          weight: 0,
        });
      }
    } catch {
      // Best-effort: the session itself still saves normally below regardless of sync outcome.
    } finally {
      setIsSyncingRoutine(false);
      setShowRoutineSyncPrompt(false);
      handleSaveWorkout();
    }
  }

  async function handleSaveWorkout() {
    if (!session) return;
    setIsFinishing(true);
    try {
      const totalSeconds = editedHours * 3600 + editedMinutes * 60 + editedSeconds;
      const endTime = new Date(new Date(session.startTime).getTime() + totalSeconds * 1000).toISOString();
      await api.patch(`/api/sessions/${sessionId}`, { endTime });
      endSession();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar el entrenamiento.');
      setIsFinishing(false);
    }
  }

  function handleSaveWorkoutClick() {
    if (getRoutineDiff()) {
      setShowRoutineSyncPrompt(true);
      return;
    }
    handleSaveWorkout();
  }

  function handleFinishClick() {
    if (session) {
      const start = new Date(session.startTime).getTime();
      const elapsedSec = Math.max(1, Math.round((Date.now() - start) / 1000));
      setEditedHours(Math.floor(elapsedSec / 3600));
      setEditedMinutes(Math.floor((elapsedSec % 3600) / 60));
      setEditedSeconds(elapsedSec % 60);
    }
    setShowSummary(true);
  }

  function handleDiscardWorkout() {
    Alert.alert('Descartar Entrenamiento', '¿Estás seguro? No se guardará ninguna serie en tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/sessions/${sessionId}`);
          } catch {
            // Best-effort: close out regardless so the user isn't stuck.
          }
          endSession();
        },
      },
    ]);
  }

  if (isLoading || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  // Only sets explicitly marked with the check count as done — logging reps/weight
  // without checking it off is not the same as completing the set.
  const completedSets = session.workoutSets.filter((s) => s.isCompleted);
  // Cardio sets store distance (in distanceUnit) in the `weight` field, not a real
  // weight — mixing them into "volume" (a weight×reps figure) would be meaningless
  // and would silently misreport the unit as kg/lbs when it's actually km/mi.
  const totalVolume = completedSets
    .filter((s) => s.exercise.muscleGroup.toLowerCase() !== 'cardio')
    .reduce((sum, s) => sum + s.weight * s.reps, 0);

  const recordsBroken: { exerciseName: string; type: string; value: number }[] = [];
  const seen = new Set<string>();
  completedSets.forEach((set) => {
    const record = session.exerciseAllTimeRecordsMap?.[set.exercise.id];
    if (!record) return;
    const volume = set.weight * set.reps;
    const oneRM = set.reps === 0 ? 0 : set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30);

    if (record.maxWeight > 0 && set.weight > record.maxWeight) {
      const key = `${set.exercise.name}-peso`;
      if (!seen.has(key)) {
        seen.add(key);
        recordsBroken.push({ exerciseName: set.exercise.name, type: 'Peso Máximo', value: set.weight });
      }
    }
    if (record.maxVolume > 0 && volume > record.maxVolume) {
      const key = `${set.exercise.name}-vol`;
      if (!seen.has(key)) {
        seen.add(key);
        recordsBroken.push({ exerciseName: set.exercise.name, type: 'Mayor Volumen', value: volume });
      }
    }
    if (record.max1RM > 0 && oneRM > record.max1RM) {
      const key = `${set.exercise.name}-1rm`;
      if (!seen.has(key)) {
        seen.add(key);
        recordsBroken.push({ exerciseName: set.exercise.name, type: 'Mejor 1RM', value: Math.round(oneRM * 10) / 10 });
      }
    }
  });

  const groupedSets: Record<string, { exercise: Exercise; sets: WorkoutSet[] }> = {};
  session.workoutSets.forEach((set) => {
    if (!groupedSets[set.exercise.id]) groupedSets[set.exercise.id] = { exercise: set.exercise, sets: [] };
    groupedSets[set.exercise.id].sets.push(set);
  });
  // Natural order = first-occurrence order in workoutSets; a manual reorder (via the
  // 3-dot menu) overrides that until the exercise list itself changes shape again.
  const naturalOrderIds = Object.keys(groupedSets);
  const orderedExerciseIds =
    exerciseOrder && exerciseOrder.length === naturalOrderIds.length && exerciseOrder.every((id) => groupedSets[id])
      ? exerciseOrder
      : naturalOrderIds;
  const orderedGroups = orderedExerciseIds.map((id) => groupedSets[id]);
  const menuExercise = menuForExerciseId ? groupedSets[menuForExerciseId]?.exercise : null;

  if (showSummary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
          <TouchableOpacity onPress={() => setShowSummary(false)} style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
            <ArrowLeft size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Resumen del Entrenamiento</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', padding: 16, borderRadius: 999, marginBottom: 10 }}>
              <Trophy size={32} color={Palette.amber500} />
            </View>
            <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>¡ENTRENAMIENTO COMPLETADO!</Text>
            <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6, textAlign: 'center' }}>Increíble trabajo hoy. Revisa tus estadísticas y guarda tu esfuerzo.</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <SummaryStat label="Volumen Total" value={`${totalVolume} ${weightUnit}`} />
            <SummaryStat label="Series Completadas" value={`${completedSets.length} sets`} />
          </View>

          <View style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)', borderRadius: 20, padding: 18, marginBottom: 20 }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
              Duración del Entrenamiento
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              <DurationStepper label="Horas" value={editedHours} onChange={(v) => setEditedHours(Math.max(0, Math.min(23, v)))} />
              <DurationStepper label="Min" value={editedMinutes} onChange={(v) => setEditedMinutes(Math.max(0, Math.min(59, v)))} />
              <DurationStepper label="Seg" value={editedSeconds} onChange={(v) => setEditedSeconds(Math.max(0, Math.min(59, v)))} />
            </View>
          </View>

          {recordsBroken.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10 }}>
                🏆 Récords Personales Superados
              </Text>
              <View style={{ gap: 8 }}>
                {recordsBroken.map((rec, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(245,158,11,0.2)',
                      borderRadius: 16,
                      padding: 14,
                    }}
                  >
                    <View>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{rec.exerciseName}</Text>
                      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 }}>{rec.type}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#fcd34d', fontWeight: '900', fontSize: 13 }}>🔥 {rec.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={handleSaveWorkoutClick}
              disabled={isFinishing}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: Palette.emerald500,
                height: 52,
                borderRadius: 16,
                opacity: isFinishing ? 0.7 : 1,
              }}
            >
              {isFinishing ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Guardar Entrenamiento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSummary(false)}
              style={{ height: 52, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '900', fontSize: 14 }}>Volver a Editar Series</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscardWorkout} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
              <Trash2 size={15} color={Palette.red400} />
              <Text style={{ color: Palette.red400, fontWeight: 'bold', fontSize: 12 }}>Descartar Entrenamiento</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={minimize} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6 }}>
            <View style={{ height: 30, width: 30, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronDown size={16} color="#fff" />
            </View>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }} numberOfLines={1}>
              {session.routine?.name || 'Entreno'}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ height: 34, width: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={15} color="#fff" />
            </View>
            <TouchableOpacity onPress={handleFinishClick} style={{ backgroundColor: Palette.cyan500, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Terminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 }}>
          <HeaderStat label="Duración" value={timeElapsed} valueColor={Palette.cyan400} />
          <HeaderStat label="Volumen" value={`${totalVolume} ${weightUnit}`} />
          <HeaderStat label="Series" value={`${completedSets.length}`} />
        </View>
      </View>

      {restSecondsLeft !== null && (
        <TouchableOpacity
          onPress={() => setRestSecondsLeft(null)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primarySoft, paddingVertical: 8 }}
        >
          <Timer size={14} color={colors.primaryAccent} />
          <Text style={{ color: colors.primaryAccent, fontWeight: 'bold', fontSize: 12 }}>
            Descanso: {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, '0')} (toca para saltar)
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        {orderedGroups.map(({ exercise, sets }, exIndex) => {
          const isCardio = exercise.muscleGroup.toLowerCase() === 'cardio';
          const isBodyweight = exercise.equipment?.toLowerCase() === 'peso corporal';
          const restDuration = restDurations[exercise.id] || 0;
          const history = session.exerciseHistoryMap?.[exercise.id] || [];
          const notes = sets[0]?.notes || '';
          const displayWeightUnit = weightUnitOverrides[exercise.id] || weightUnit;

          return (
            <View key={exercise.id} style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
              <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceSunken, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExerciseAvatar imageUrl={exercise.imageUrl} equipment={exercise.equipment} muscleGroup={exercise.muscleGroup} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.primaryAccent }} numberOfLines={1}>
                    {exIndex + 1}. {exercise.name}
                  </Text>
                  {!!exercise.equipment && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{exercise.equipment}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => setMenuForExerciseId(exercise.id)}
                  disabled={removingExerciseId === exercise.id}
                  style={{ height: 32, width: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  {removingExerciseId === exercise.id ? (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  ) : (
                    <MoreVertical size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                <TextInput
                  defaultValue={notes}
                  onEndEditing={(e) => handleSaveNotes(exercise.id, e.nativeEvent.text)}
                  placeholder="Agregar notas aquí..."
                  placeholderTextColor={colors.textMuted}
                  style={{ fontSize: 12, color: colors.textSecondary, paddingVertical: 4 }}
                />
                {!isCardio && (
                  <TouchableOpacity onPress={() => cycleRestDuration(exercise.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
                    <Timer size={13} color={colors.primaryAccent} />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primaryAccent }}>
                      Descanso: {restDuration === 0 ? 'APAGADO' : `${restDuration}s`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ padding: 10, gap: 8 }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
                  <Text style={{ width: 28, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>#</Text>
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>Anterior</Text>
                  {!isBodyweight && (
                    isCardio ? (
                      <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>
                        Dist.
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={() => setUnitPickerExerciseId(exercise.id)} style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.primaryAccent, textTransform: 'uppercase', textDecorationLine: 'underline' }}>
                          {displayWeightUnit}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>
                    {isCardio ? 'Min' : 'Reps'}
                  </Text>
                  <Text style={{ width: 44, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>✓</Text>
                </View>

                {sets.map((set, setIndex) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    index={setIndex}
                    isCardio={isCardio}
                    isBodyweight={isBodyweight}
                    colors={colors}
                    isDark={theme === 'dark'}
                    historicalSet={history[setIndex]}
                    storageWeightUnit={weightUnit}
                    displayWeightUnit={displayWeightUnit}
                    distanceUnit={distanceUnit}
                    onUpdate={(setId, reps, weight, isCompleted) => handleUpdateSet(setId, reps, weight, isCompleted, exercise.id)}
                    allTimeRecords={session.exerciseAllTimeRecordsMap?.[exercise.id]}
                    onShowRecord={setActiveRecord}
                  />
                ))}

                <TouchableOpacity
                  onPress={() => handleAddSet(exercise)}
                  disabled={addingSetForExerciseId === exercise.id}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 2, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border }}
                >
                  {addingSetForExerciseId === exercise.id ? (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  ) : (
                    <>
                      <Plus size={14} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>Añadir Serie</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={openExercisePicker}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <Plus size={16} color={colors.primaryAccent} />
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primaryAccent }}>Añadir Ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!activeRecord} transparent animationType="fade" onRequestClose={() => setActiveRecord(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)', borderRadius: 28, padding: 24 }}>
            <TouchableOpacity
              onPress={() => setActiveRecord(null)}
              style={{ position: 'absolute', top: 16, right: 16, padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, zIndex: 1 }}
            >
              <X size={16} color={Palette.slate400} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: 18, borderRadius: 999 }}>
                <Trophy size={36} color={Palette.amber500} />
              </View>
            </View>

            <Text style={{ color: Palette.amber400, fontSize: 17, fontWeight: '900', textAlign: 'center' }}>¡NUEVO RÉCORD PERSONAL!</Text>
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', marginTop: 4, letterSpacing: 1 }}>
              {activeRecord?.exerciseName}
            </Text>

            <View style={{ gap: 12, marginTop: 20 }}>
              {activeRecord?.brokeWeight && (
                <RecordRow
                  label="Peso Máximo"
                  labelColor={Palette.amber500}
                  oldValue={`Anterior: ${activeRecord.oldWeight} ${weightUnit}`}
                  newValue={`${activeRecord.weight} ${weightUnit}`}
                  delta={Math.round((activeRecord.weight - activeRecord.oldWeight) * 10) / 10}
                />
              )}
              {activeRecord?.broke1RM && (
                <RecordRow
                  label="Mejor 1RM Estimado"
                  labelColor={Palette.cyan500}
                  oldValue={`Anterior: ${activeRecord.old1RM} ${weightUnit}`}
                  newValue={`${activeRecord.new1RM} ${weightUnit}`}
                  delta={Math.round((activeRecord.new1RM - activeRecord.old1RM) * 10) / 10}
                />
              )}
              {activeRecord?.brokeVolume && (
                <RecordRow
                  label="Mayor Volumen de Serie"
                  labelColor={Palette.violet600}
                  oldValue={`Anterior: ${activeRecord.oldVolume} ${weightUnit}`}
                  newValue={`${activeRecord.newVolume} ${weightUnit}`}
                  delta={activeRecord.newVolume - activeRecord.oldVolume}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={() => setActiveRecord(null)}
              style={{ marginTop: 20, height: 50, borderRadius: 16, backgroundColor: Palette.amber500, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>¡Seguir Entrenando!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsPickerOpen(false);
          setReplaceTargetExerciseId(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>
                {replaceTargetExerciseId ? 'Reemplazar Ejercicio' : 'Añadir Ejercicio'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsPickerOpen(false);
                  setReplaceTargetExerciseId(null);
                }}
                style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 14, paddingHorizontal: 12 }}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder="Buscar ejercicio..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, color: colors.textPrimary, height: 44 }}
                />
              </View>
            </View>
            <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 24, gap: 8 }}>
              {exerciseCatalog
                .filter((ex) => ex.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()))
                .map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    onPress={() => (replaceTargetExerciseId ? handleReplaceExercise(ex) : handleAddExercise(ex))}
                    disabled={isAddingExercise || isReplacingExercise}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken, opacity: isAddingExercise || isReplacingExercise ? 0.6 : 1 }}
                  >
                    <ExerciseAvatar imageUrl={ex.imageUrl} equipment={ex.equipment} muscleGroup={ex.muscleGroup} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                        {ex.muscleGroup}
                        {ex.equipment ? ` • ${ex.equipment}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showRoutineSyncPrompt} transparent animationType="fade" onRequestClose={() => setShowRoutineSyncPrompt(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)', borderRadius: 24, padding: 22 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' }}>¿Actualizar tu rutina?</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
              Has añadido series o ejercicios nuevos respecto a &quot;{session.routine?.name}&quot;. ¿Quieres guardar estos cambios en la rutina para tus próximos entrenamientos, o dejarla como estaba?
            </Text>
            <View style={{ gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={syncRoutineWithSession}
                disabled={isSyncingRoutine}
                style={{ height: 50, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSyncingRoutine ? 0.7 : 1 }}
              >
                {isSyncingRoutine ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Actualizar Rutina</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowRoutineSyncPrompt(false);
                  handleSaveWorkout();
                }}
                disabled={isSyncingRoutine}
                style={{ height: 50, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#cbd5e1', fontWeight: '900', fontSize: 14 }}>Dejar Rutina como Estaba</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!menuForExerciseId} transparent animationType="fade" onRequestClose={() => setMenuForExerciseId(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setMenuForExerciseId(null)}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 10, paddingBottom: 24 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', padding: 10 }} numberOfLines={1}>
              {menuExercise?.name}
            </Text>
            <TouchableOpacity
              onPress={() => startReorder(orderedExerciseIds)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 }}
            >
              <ArrowUpDown size={18} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>Reordenar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => menuForExerciseId && openReplacePicker(menuForExerciseId)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 }}
            >
              <Repeat size={18} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>Reemplazar Ejercicio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => menuForExerciseId && menuExercise && handleRemoveExercise(menuForExerciseId, menuExercise.name)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 }}
            >
              <Trash2 size={18} color={Palette.red500} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: Palette.red500 }}>Eliminar Ejercicio</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isReordering} transparent animationType="slide" onRequestClose={() => setIsReordering(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>Reordenar Ejercicios</Text>
              <TouchableOpacity onPress={() => setIsReordering(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', paddingTop: 12 }}>
              Mantén pulsado el icono de agarre y arrastra para reordenar
            </Text>
            <ScrollView contentContainerStyle={{ padding: 16 }} scrollEnabled={false}>
              <View style={{ position: 'relative' }}>
                {reorderDraft.map((exerciseId, index) => {
                  const ex = groupedSets[exerciseId]?.exercise;
                  if (!ex) return null;
                  return <DraggableReorderRow key={exerciseId} exerciseId={exerciseId} exercise={ex} index={index} colors={colors} onMove={handleReorderDragMove} />;
                })}
              </View>
            </ScrollView>
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                onPress={confirmReorder}
                style={{ height: 50, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!unitPickerExerciseId} transparent animationType="fade" onRequestClose={() => setUnitPickerExerciseId(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setUnitPickerExerciseId(null)}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 10, paddingBottom: 24 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', padding: 10 }}>Unidad de Peso</Text>
            {(['default', 'kg', 'lbs'] as const).map((option) => {
              const isSelected = option === 'default' ? !unitPickerExerciseId || !weightUnitOverrides[unitPickerExerciseId] : weightUnitOverrides[unitPickerExerciseId!] === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    if (!unitPickerExerciseId) return;
                    setWeightUnitOverrides((prev) => {
                      const next = { ...prev };
                      if (option === 'default') delete next[unitPickerExerciseId];
                      else next[unitPickerExerciseId] = option;
                      return next;
                    });
                    setUnitPickerExerciseId(null);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: isSelected ? colors.primarySoft : 'transparent' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: isSelected ? '900' : '600', color: isSelected ? colors.primaryAccent : colors.textPrimary }}>
                    {option === 'default' ? `Valor predeterminado (${weightUnit})` : option}
                  </Text>
                  {isSelected && <Check size={16} color={colors.primaryAccent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function HeaderStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold' }}>{label}</Text>
      <Text style={{ color: valueColor || '#fff', fontSize: 15, fontWeight: '900', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function RecordRow({
  label,
  labelColor,
  oldValue,
  newValue,
  delta,
}: {
  label: string;
  labelColor: string;
  oldValue: string;
  newValue: string;
  delta: number;
}) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: labelColor, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{oldValue}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{newValue}</Text>
        <Text style={{ color: Palette.emerald400, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 }}>¡Superado! (+{delta})</Text>
      </View>
    </View>
  );
}

function DurationStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <TouchableOpacity
        onPress={() => onChange(value + 1)}
        style={{ width: 60, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '900' }}>+</Text>
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', minWidth: 60, textAlign: 'center' }}>{value.toString().padStart(2, '0')}</Text>
      <TouchableOpacity
        onPress={() => onChange(value - 1)}
        style={{ width: 60, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '900' }}>−</Text>
      </TouchableOpacity>
      <Text style={{ color: '#64748b', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(30,41,59,0.4)', borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)', borderRadius: 16, padding: 14 }}>
      <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SetRow({
  set,
  index,
  isCardio,
  isBodyweight,
  colors,
  isDark,
  historicalSet,
  storageWeightUnit,
  displayWeightUnit,
  distanceUnit,
  onUpdate,
  allTimeRecords,
  onShowRecord,
}: {
  set: WorkoutSet;
  index: number;
  isCardio: boolean;
  isBodyweight: boolean;
  colors: any;
  isDark: boolean;
  historicalSet?: HistoricalSet;
  /** The account's global weight unit — what `set.weight`/`allTimeRecords` are stored in. */
  storageWeightUnit: string;
  /** This exercise's chosen display unit (defaults to storageWeightUnit unless overridden). */
  displayWeightUnit: string;
  distanceUnit: string;
  onUpdate: (setId: string, reps: number, weight: number, isCompleted: boolean) => void;
  allTimeRecords?: AllTimeRecord;
  onShowRecord: (record: ActiveRecord) => void;
}) {
  // Cardio's "weight" field is actually a distance and is never unit-converted here —
  // only real weight (kg/lbs) gets the display-unit override treatment.
  const needsConversion = !isCardio && !isBodyweight && displayWeightUnit !== storageWeightUnit;

  const [reps, setReps] = useState(set.reps === 0 ? '' : set.reps.toString());
  const [weight, setWeight] = useState(() => {
    if (set.weight === 0) return '';
    const displayVal = needsConversion ? convertWeightValue(set.weight, storageWeightUnit as 'kg' | 'lbs', displayWeightUnit as 'kg' | 'lbs') : set.weight;
    return roundWeight(displayVal).toString();
  });

  useEffect(() => {
    setReps(set.reps === 0 ? '' : set.reps.toString());
    if (set.weight === 0) {
      setWeight('');
    } else {
      const displayVal = needsConversion ? convertWeightValue(set.weight, storageWeightUnit as 'kg' | 'lbs', displayWeightUnit as 'kg' | 'lbs') : set.weight;
      setWeight(roundWeight(displayVal).toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.reps, set.weight, displayWeightUnit]);

  function commit(isCompleted: boolean) {
    const displayVal = Number(weight) || 0;
    const storageVal = needsConversion
      ? roundWeight(convertWeightValue(displayVal, displayWeightUnit as 'kg' | 'lbs', storageWeightUnit as 'kg' | 'lbs'))
      : displayVal;
    onUpdate(set.id, Number(reps) || 0, storageVal, isCompleted);
  }

  // Records (allTimeRecords) are compared in storage units, regardless of this
  // exercise's display override.
  const currentWeightStorage = (() => {
    const displayVal = Number(weight) || 0;
    return needsConversion ? roundWeight(convertWeightValue(displayVal, displayWeightUnit as 'kg' | 'lbs', storageWeightUnit as 'kg' | 'lbs')) : displayVal;
  })();
  const currentReps = Number(reps) || 0;
  const currentVolume = currentWeightStorage * currentReps;
  const current1RM = currentReps === 0 ? 0 : currentReps === 1 ? currentWeightStorage : currentWeightStorage * (1 + currentReps / 30);

  const brokeWeight = set.isCompleted && !!allTimeRecords && allTimeRecords.maxWeight > 0 && currentWeightStorage > allTimeRecords.maxWeight;
  const broke1RM = set.isCompleted && !!allTimeRecords && allTimeRecords.max1RM > 0 && current1RM > allTimeRecords.max1RM;
  const brokeVolume = set.isCompleted && !!allTimeRecords && allTimeRecords.maxVolume > 0 && currentVolume > allTimeRecords.maxVolume;
  const isRecord = !isCardio && (brokeWeight || broke1RM || brokeVolume);

  function handleShowRecord() {
    if (!isRecord || !allTimeRecords) return;
    onShowRecord({
      exerciseName: set.exercise.name,
      brokeWeight,
      broke1RM,
      brokeVolume,
      weight: currentWeightStorage,
      oldWeight: allTimeRecords.maxWeight,
      old1RM: allTimeRecords.max1RM,
      oldVolume: allTimeRecords.maxVolume,
      new1RM: Math.round(current1RM * 10) / 10,
      newVolume: currentVolume,
    });
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: set.isCompleted ? (isDark ? 'rgba(16,185,129,0.12)' : Palette.emerald50) : 'transparent',
      }}
    >
      <Text style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textMuted }}>{index + 1}</Text>
      <Text style={{ flex: 1, textAlign: 'center', fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
        {historicalSet
          ? isBodyweight
            ? `${historicalSet.reps} reps`
            : isCardio
              ? `${historicalSet.weight}${distanceUnit} x ${historicalSet.reps}`
              : `${roundWeight(needsConversion ? convertWeightValue(historicalSet.weight, storageWeightUnit as 'kg' | 'lbs', displayWeightUnit as 'kg' | 'lbs') : historicalSet.weight)}${displayWeightUnit} x ${historicalSet.reps}`
          : '—'}
      </Text>
      {!isBodyweight && (
        <TextInput
          value={weight}
          onChangeText={setWeight}
          onBlur={() => commit(set.isCompleted)}
          keyboardType="numeric"
          editable={!set.isCompleted}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            marginHorizontal: 4,
            textAlign: 'center',
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: set.isCompleted ? 'transparent' : colors.border,
            color: set.isCompleted ? Palette.emerald500 : colors.textPrimary,
            fontSize: 14,
            fontWeight: '600',
          }}
        />
      )}
      <TextInput
        value={reps}
        onChangeText={setReps}
        onBlur={() => commit(set.isCompleted)}
        keyboardType="numeric"
        editable={!set.isCompleted}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        style={{
          flex: 1,
          marginHorizontal: 4,
          textAlign: 'center',
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: set.isCompleted ? 'transparent' : colors.border,
          color: set.isCompleted ? Palette.emerald500 : colors.textPrimary,
          fontSize: 14,
          fontWeight: '600',
        }}
      />
      {isRecord && (
        <TouchableOpacity
          onPress={handleShowRecord}
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(245,158,11,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(245,158,11,0.3)',
            marginRight: 4,
          }}
        >
          <Flame size={16} color={Palette.amber500} fill={Palette.amber500} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => commit(!set.isCompleted)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: set.isCompleted ? Palette.emerald500 : colors.surfaceAlt,
        }}
      >
        <Check size={18} color={set.isCompleted ? '#fff' : colors.textMuted} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

function DraggableReorderRow({
  exerciseId,
  exercise,
  index,
  colors,
  onMove,
}: {
  exerciseId: string;
  exercise: Exercise;
  index: number;
  colors: any;
  onMove: (exerciseId: string, targetIndex: number) => void;
}) {
  const dragY = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const indexRef = useRef(index);
  const startIndexRef = useRef(index);
  indexRef.current = index;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        startIndexRef.current = indexRef.current;
        setIsDragging(true);
      },
      onPanResponderMove: (_evt, gesture) => {
        // indexRef.current reflects how many slots this row has already shifted
        // from prior reorders — the raw finger delta must be reduced by that
        // amount, or the row visually jumps ahead of the finger as it reorders.
        const alreadyShifted = (indexRef.current - startIndexRef.current) * REORDER_ROW_HEIGHT;
        dragY.setValue(gesture.dy - alreadyShifted);
        const targetIndex = Math.round((startIndexRef.current * REORDER_ROW_HEIGHT + gesture.dy) / REORDER_ROW_HEIGHT);
        onMove(exerciseId, targetIndex);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        Animated.timing(dragY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.timing(dragY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        height: REORDER_ROW_HEIGHT,
        justifyContent: 'center',
        zIndex: isDragging ? 10 : 1,
        elevation: isDragging ? 4 : 0,
        transform: [{ translateY: isDragging ? dragY : 0 }],
        opacity: isDragging ? 0.96 : 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surfaceSunken,
          borderWidth: 1,
          borderColor: isDragging ? colors.primary : colors.border,
          borderRadius: 14,
          padding: 10,
          marginBottom: 8,
        }}
      >
        <ExerciseAvatar imageUrl={exercise.imageUrl} equipment={exercise.equipment} muscleGroup={exercise.muscleGroup} size={32} />
        <Text style={{ flex: 1, fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View {...panResponder.panHandlers} style={{ padding: 8 }}>
          <GripVertical size={18} color={colors.textMuted} />
        </View>
      </View>
    </Animated.View>
  );
}
