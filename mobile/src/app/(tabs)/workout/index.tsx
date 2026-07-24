import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Sparkles,
  Dumbbell,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  ChevronRight,
  X,
  Trash2,
  Edit3,
  Search,
  Check,
  RotateCcw,
  Volume2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { api } from '../../../lib/apiClient';
import { generateWorkoutPlan, DbExercise } from '../../../lib/workoutEngine';

interface RoutineExercise {
  id?: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number | string;
  weight: number;
  rir: number;
  tempo: string;
  descanso: string;
}

interface Routine {
  id: string;
  name: string;
  createdAt?: string;
  exercises: RoutineExercise[];
}

export default function WorkoutScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [routines, setRoutines] = useState<Routine[]>([]);

  // Active Workout Live Session State
  const [activeSession, setActiveSession] = useState<{
    routine: Routine;
    startTime: Date;
    completedSets: Record<string, boolean>;
    actualWeights: Record<string, string>;
    actualReps: Record<string, string>;
  } | null>(null);

  // Floating Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [timerMax, setTimerMax] = useState(90);

  // Custom Routine Builder Modal
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [builderExercises, setBuilderExercises] = useState<RoutineExercise[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('Todos');

  // AI Workout Planner Wizard Modal
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experienceLevel, setExperienceLevel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  const [focusArea, setFocusArea] = useState<'hipertrofia' | 'fuerza' | 'perdida_grasa'>('hipertrofia');
  const [selectedSplit, setSelectedSplit] = useState<'auto' | 'full_body' | 'torso_pierna' | 'ppl'>('auto');

  useEffect(() => {
    fetchRoutines();
  }, []);

  // Rest Timer Countdown Effect
  useEffect(() => {
    let interval: any;
    if (restTimerSeconds !== null && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimerSeconds === 0) {
      // Haptic Vibration when timer reaches zero
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [restTimerSeconds]);

  async function fetchRoutines() {
    setIsLoading(true);
    try {
      const res = await api.get('/api/routines').catch(() => null);
      if (res && Array.isArray(res)) {
        setRoutines(res);
      } else {
        setRoutines([]);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Start Live Workout Session
  function startWorkoutSession(routine: Routine) {
    setActiveSession({
      routine,
      startTime: new Date(),
      completedSets: {},
      actualWeights: {},
      actualReps: {},
    });
  }

  // Toggle Live Set Completed & Trigger Rest Timer
  function toggleSetCompleted(setKey: string, restSecs: number = 90) {
    if (!activeSession) return;
    const isCompleted = !activeSession.completedSets[setKey];

    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            completedSets: { ...prev.completedSets, [setKey]: isCompleted },
          }
        : null
    );

    if (isCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimerMax(restSecs);
      setRestTimerSeconds(restSecs);
    }
  }

  // Save Finished Workout Session
  async function finishWorkoutSession() {
    if (!activeSession) return;

    try {
      const durationMins = Math.max(1, Math.round((new Date().getTime() - activeSession.startTime.getTime()) / 60000));
      await api.post('/api/sessions/start', {
        routineId: activeSession.routine.id,
        durationMinutes: durationMins,
      });

      Alert.alert('¡Entrenamiento Completado! 🎉', `Has completado ${activeSession.routine.name} en ${durationMins} minutos.`);
      setActiveSession(null);
      setRestTimerSeconds(null);
      await fetchRoutines();
    } catch (error: any) {
      Alert.alert('Sesión Finalizada', 'Entrenamiento registrado localmente.');
      setActiveSession(null);
      setRestTimerSeconds(null);
    }
  }

  // Delete Routine
  async function handleDeleteRoutine(id: string) {
    Alert.alert('Eliminar Rutina', '¿Seguro que deseas eliminar esta rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/routines/${id}`);
            setRoutines((prev) => prev.filter((r) => r.id !== id));
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la rutina');
          }
        },
      },
    ]);
  }

  // Save Custom Routine
  async function handleSaveCustomRoutine() {
    if (!newRoutineName.trim()) {
      Alert.alert('Nombre Requerido', 'Introduce un nombre para la rutina.');
      return;
    }

    try {
      const created = await api.post('/api/routines', {
        name: newRoutineName,
        exercises: builderExercises,
      });

      setRoutines((prev) => [created, ...prev]);
      setShowBuilderModal(false);
      setNewRoutineName('');
      setBuilderExercises([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la rutina');
    }
  }

  // Generate AI Routine
  async function handleGenerateAIRoutine() {
    const generated = generateWorkoutPlan(
      {
        days: daysPerWeek,
        level: experienceLevel,
        split: selectedSplit,
        priorities: [],
        injuries: [],
        goal: focusArea,
        nutrition: 'normocalorica',
      },
      []
    );

    if (generated && generated.length > 0) {
      try {
        for (const day of generated) {
          const created = await api.post('/api/routines', {
            name: day.name,
            exercises: day.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              name: e.name,
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight || 0,
              rir: e.rir,
              tempo: e.tempo,
              descanso: e.descanso,
            })),
          });
          setRoutines((prev) => [created, ...prev]);
        }
      } catch (e) {
        console.error('Error saving AI generated routines to DB:', e);
      }
    }

    setShowPlannerModal(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#ffffff' }}>Entrenamientos</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Rutinas personalizadas y generador científico
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowBuilderModal(true)}
              style={{
                backgroundColor: '#1e293b',
                borderWidth: 1,
                borderColor: '#334155',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Crear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPlannerModal(true)}
              style={{
                backgroundColor: '#a855f7',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Rutina IA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Routines List */}
        {isLoading ? (
          <ActivityIndicator color="#a855f7" style={{ marginVertical: 40 }} />
        ) : routines.length > 0 ? (
          <View style={{ gap: 16 }}>
            {routines.map((routine) => (
              <View
                key={routine.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 22,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#334155',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>{routine.name}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {routine.exercises?.length || 0} ejercicios programados
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleDeleteRoutine(routine.id)} style={{ padding: 6 }}>
                      <Trash2 size={18} color="#f43f5e" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => startWorkoutSession(routine)}
                      style={{
                        backgroundColor: '#a855f7',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Play size={14} color="#ffffff" />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff' }}>Iniciar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Exercises preview */}
                {routine.exercises && routine.exercises.length > 0 ? (
                  <View style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' }}>
                    {routine.exercises.slice(0, 4).map((ex, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>• {ex.name}</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#a855f7' }}>
                          {ex.sets} series x {ex.reps} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 22,
              padding: 28,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Dumbbell size={44} color="#64748b" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
              No tienes ninguna rutina creada
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
              Genera tu rutina basada en la ciencia con IA o crea tu entrenamiento personalizado.
            </Text>

            <TouchableOpacity
              onPress={() => setShowPlannerModal(true)}
              style={{
                backgroundColor: '#a855f7',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Generar Rutina IA</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Live Workout Session Modal */}
      <Modal visible={!!activeSession} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
          <View style={{ flex: 1, padding: 20 }}>
            {/* Live Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#a855f7', textTransform: 'uppercase' }}>
                  Sesión en Vivo
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff' }}>
                  {activeSession?.routine.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={finishWorkoutSession}
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={16} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Finalizar</Text>
              </TouchableOpacity>
            </View>

            {/* Floating Rest Timer Notification Banner */}
            {restTimerSeconds !== null && (
              <View
                style={{
                  backgroundColor: restTimerSeconds === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                  borderColor: restTimerSeconds === 0 ? '#10b981' : '#a855f7',
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={20} color={restTimerSeconds === 0 ? '#10b981' : '#a855f7'} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>
                    {restTimerSeconds === 0 ? '¡TIEMPO DE DESCANSO TERMINADO!' : `Descanso: ${restTimerSeconds}s`}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setRestTimerSeconds(null)}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Live Exercises Tracker List */}
            <ScrollView style={{ flex: 1 }}>
              {activeSession?.routine.exercises?.map((ex, exIdx) => (
                <View
                  key={exIdx}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#334155',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 }}>
                    {ex.name} <Text style={{ fontSize: 12, color: '#94a3b8' }}>({ex.descanso})</Text>
                  </Text>

                  {/* Sets Rows */}
                  {Array.from({ length: ex.sets }).map((_, sIdx) => {
                    const setKey = `${exIdx}_${sIdx}`;
                    const isDone = !!activeSession.completedSets[setKey];

                    return (
                      <View
                        key={sIdx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                          borderRadius: 12,
                          padding: 10,
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff', width: 60 }}>
                          Serie {sIdx + 1}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TextInput
                            placeholder={`${ex.weight || 0} kg`}
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#ffffff',
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              height: 36,
                              width: 70,
                              textAlign: 'center',
                              fontSize: 13,
                            }}
                          />

                          <TextInput
                            placeholder={`${ex.reps} reps`}
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#ffffff',
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              height: 36,
                              width: 70,
                              textAlign: 'center',
                              fontSize: 13,
                            }}
                          />

                          <TouchableOpacity
                            onPress={() => toggleSetCompleted(setKey, parseInt(ex.descanso) || 90)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: isDone ? '#10b981' : '#334155',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={18} color="#ffffff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* AI Workout Planner Modal */}
      <Modal visible={showPlannerModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>Generador Científico IA</Text>
                <TouchableOpacity onPress={() => setShowPlannerModal(false)} style={{ padding: 6 }}>
                  <X size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Days selection */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Días de Entrenamiento por Semana
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[3, 4, 5, 6].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDaysPerWeek(d)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: daysPerWeek === d ? '#a855f7' : '#334155',
                      backgroundColor: daysPerWeek === d ? 'rgba(168, 85, 247, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: daysPerWeek === d ? '#a855f7' : '#ffffff' }}>
                      {d} Días
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Experience level */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Nivel de Experiencia
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                {[
                  { id: 'principiante', label: 'Principiante' },
                  { id: 'intermedio', label: 'Intermedio' },
                  { id: 'avanzado', label: 'Avanzado' },
                ].map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => setExperienceLevel(l.id as any)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: experienceLevel === l.id ? '#06b6d4' : '#334155',
                      backgroundColor: experienceLevel === l.id ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: experienceLevel === l.id ? '#06b6d4' : '#ffffff' }}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleGenerateAIRoutine}
                style={{
                  backgroundColor: '#a855f7',
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <Sparkles size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Crear Rutinas Guardadas</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
