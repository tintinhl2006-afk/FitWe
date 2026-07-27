import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, StopCircle, Clock, Trophy, Save, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { usePreferences } from '../../../../context/PreferencesContext';
import { Palette } from '../../../../constants/theme';
import { api } from '../../../../lib/apiClient';
import { ExerciseAvatar } from '../../../../components/workout/ExerciseAvatar';

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

interface AllTimeRecord {
  maxWeight: number;
  max1RM: number;
  maxVolume: number;
}

interface WorkoutSession {
  id: string;
  routineId: string;
  startTime: string;
  endTime: string | null;
  workoutSets: WorkoutSet[];
  routine?: { name: string };
  exerciseAllTimeRecordsMap?: Record<string, AllTimeRecord>;
}

export default function LiveWorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { colors, theme } = useAppTheme();
  const { weightUnit } = usePreferences();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [showSummary, setShowSummary] = useState(false);

  async function fetchSession() {
    try {
      const data = await api.get(`/api/sessions/${sessionId}`);
      setSession(data);
    } catch {
      router.replace('/workout');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session?.startTime || session.endTime) return;
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
  }, [session?.startTime, session?.endTime]);

  async function handleUpdateSet(setId: string, reps: number, weight: number, isCompleted: boolean) {
    setSession((prev) =>
      prev ? { ...prev, workoutSets: prev.workoutSets.map((s) => (s.id === setId ? { ...s, reps, weight, isCompleted } : s)) } : prev
    );
    try {
      await api.patch(`/api/sessions/sets/${setId}`, { reps, weight, isCompleted });
    } catch {
      fetchSession();
    }
  }

  async function handleSaveWorkout() {
    if (!session) return;
    setIsFinishing(true);
    try {
      const uncompleted = session.workoutSets.filter((s) => !s.isCompleted && (s.reps > 0 || s.weight > 0));
      if (uncompleted.length > 0) {
        await Promise.all(uncompleted.map((s) => api.patch(`/api/sessions/sets/${s.id}`, { reps: s.reps, weight: s.weight, isCompleted: true })));
      }
      await api.patch(`/api/sessions/${sessionId}`, { endTime: new Date().toISOString() });
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar el entrenamiento.');
      setIsFinishing(false);
    }
  }

  function handleFinishClick() {
    setShowSummary(true);
  }

  function handleDiscardWorkout() {
    Alert.alert('Descartar Entrenamiento', '¿Estás seguro? No se guardará ninguna serie en tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.replace('/') },
    ]);
  }

  if (isLoading || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const completedSets = session.workoutSets.filter((s) => s.isCompleted);
  const totalVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

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

          <View style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)', borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 }}>Duración del Entrenamiento</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>{timeElapsed}</Text>
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
              onPress={handleSaveWorkout}
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
      <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }} numberOfLines={1}>
            {session.routine?.name || 'Entrenamiento Libre'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Clock size={13} color={Palette.cyan400} />
            <Text style={{ color: Palette.cyan400, fontSize: 13, fontWeight: '600' }}>{timeElapsed}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleFinishClick}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.red500, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 }}
        >
          <StopCircle size={15} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Terminar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        {Object.values(groupedSets).map(({ exercise, sets }, exIndex) => {
          const isCardio = exercise.muscleGroup.toLowerCase() === 'cardio';
          const isBodyweight = exercise.equipment?.toLowerCase() === 'peso corporal';

          return (
            <View key={exercise.id} style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
              <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceSunken, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExerciseAvatar imageUrl={exercise.imageUrl} equipment={exercise.equipment} muscleGroup={exercise.muscleGroup} size={36} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {exIndex + 1}. {exercise.name}
                </Text>
              </View>

              <View style={{ padding: 10, gap: 8 }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
                  <Text style={{ width: 32, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>#</Text>
                  {!isBodyweight && (
                    <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>
                      {isCardio ? 'Dist.' : weightUnit}
                    </Text>
                  )}
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase' }}>
                    {isCardio ? 'Min' : 'Reps'}
                  </Text>
                  <Text style={{ width: 44, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>✓</Text>
                </View>

                {sets.map((set, setIndex) => (
                  <SetRow key={set.id} set={set} index={setIndex} isCardio={isCardio} isBodyweight={isBodyweight} colors={colors} isDark={theme === 'dark'} onUpdate={handleUpdateSet} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
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
  onUpdate,
}: {
  set: WorkoutSet;
  index: number;
  isCardio: boolean;
  isBodyweight: boolean;
  colors: any;
  isDark: boolean;
  onUpdate: (setId: string, reps: number, weight: number, isCompleted: boolean) => void;
}) {
  const [reps, setReps] = useState(set.reps === 0 ? '' : set.reps.toString());
  const [weight, setWeight] = useState(set.weight === 0 ? '' : set.weight.toString());

  function commit(isCompleted: boolean) {
    onUpdate(set.id, Number(reps) || 0, Number(weight) || 0, isCompleted);
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
      <Text style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textMuted }}>{index + 1}</Text>
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
