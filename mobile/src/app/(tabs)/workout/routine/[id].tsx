import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Modal, PanResponder, Animated } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Trash2,
  Check,
  Edit2,
  Dumbbell,
  Play,
  Minus,
  RefreshCcw,
  GripVertical,
  ArrowUpDown,
  Download,
} from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { Palette } from '../../../../constants/theme';
import { api } from '../../../../lib/apiClient';
import { ExerciseAvatar } from '../../../../components/workout/ExerciseAvatar';

const REORDER_ROW_HEIGHT = 64;

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  imageUrl?: string | null;
}

interface RoutineExercise {
  id: string;
  exercise: Exercise;
  exerciseId: string;
  sets: number;
  reps: number;
  repsList?: string | null;
  lastHistory?: string;
}

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises: RoutineExercise[];
}

const MUSCLE_GROUPS = ['', 'Pecho', 'Espalda', 'Pierna', 'Brazo', 'Hombro', 'Core', 'Cardio'];
const EQUIPMENT_TYPES = ['', 'Barra', 'Mancuernas', 'Máquina', 'Peso Corporal'];

function getRepsArray(re: RoutineExercise): number[] {
  if (re.repsList) return re.repsList.split(',').map((v) => parseInt(v.trim(), 10) || re.reps);
  return Array(re.sets).fill(re.reps || 10);
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'picker' | 'config'>('picker');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [hasTargetReps, setHasTargetReps] = useState(true);
  const [repsPerSet, setRepsPerSet] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Reorder mode (drag to reorder exercises)
  const [isReordering, setIsReordering] = useState(false);
  const [orderedExercises, setOrderedExercises] = useState<RoutineExercise[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  async function fetchRoutine() {
    try {
      const data = await api.get(`/api/routines/${id}`);
      setRoutine(data);
    } catch {
      router.replace('/workout');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRoutine();
    api
      .get('/api/exercises')
      .then((data) => setExerciseCatalog(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setRepsPerSet((prev) => {
      const next = [...prev];
      while (next.length < sets) next.push(10);
      next.length = sets;
      return next;
    });
  }, [sets]);

  async function handleRenameRoutine() {
    if (!tempName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await api.patch(`/api/routines/${id}`, { name: tempName.trim() });
      setRoutine((prev) => (prev ? { ...prev, name: res.routine.name } : prev));
      setIsEditingName(false);
    } catch {
      Alert.alert('Error', 'No se pudo renombrar la rutina.');
    } finally {
      setIsSavingName(false);
    }
  }

  function openPicker() {
    setReplacingId(null);
    setSearchQuery('');
    setFilterMuscle('');
    setFilterEquipment('');
    setSelectedExercise(null);
    setStep('picker');
    setIsModalOpen(true);
  }

  function openReplacePicker(re: RoutineExercise) {
    setReplacingId(re.id);
    setSearchQuery('');
    setFilterMuscle('');
    setFilterEquipment('');
    setSelectedExercise(null);
    setStep('picker');
    setIsModalOpen(true);
  }

  function selectExerciseForConfig(ex: Exercise) {
    setSelectedExercise(ex);
    setSets(ex.muscleGroup.toLowerCase() === 'cardio' ? 1 : 3);
    setHasTargetReps(true);
    setStep('config');
  }

  async function handleAddExercise() {
    if (!selectedExercise || !routine) return;
    const isDuplicate = routine.exercises.some((re) => re.exerciseId === selectedExercise.id && re.id !== replacingId);
    if (isDuplicate) {
      Alert.alert('Ya añadido', 'Este ejercicio ya está en la rutina.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetReps = repsPerSet[0] !== undefined ? repsPerSet[0] : 10;
      const repsList = hasTargetReps ? repsPerSet.join(',') : null;
      if (replacingId) {
        await api.patch(`/api/routines/${id}/exercises/${replacingId}`, {
          exerciseId: selectedExercise.id,
          sets,
          reps: targetReps,
          repsList,
        });
      } else {
        await api.post(`/api/routines/${id}/exercises`, {
          exerciseId: selectedExercise.id,
          sets,
          reps: targetReps,
          repsList,
          weight: 0,
        });
      }
      setIsModalOpen(false);
      setReplacingId(null);
      await fetchRoutine();
    } catch {
      Alert.alert('Error', replacingId ? 'No se pudo cambiar el ejercicio.' : 'No se pudo añadir el ejercicio.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteExercise(routineExerciseId: string) {
    Alert.alert('Eliminar Ejercicio', '¿Seguro que quieres eliminar este ejercicio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/routines/${id}/exercises/${routineExerciseId}`);
            await fetchRoutine();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el ejercicio.');
          }
        },
      },
    ]);
  }

  async function handleUpdateSets(re: RoutineExercise, delta: number) {
    const newSets = re.sets + delta;
    if (newSets < 1 || newSets > 9) return;

    const currentRepsArray = re.repsList ? re.repsList.split(',').map((v) => parseInt(v.trim(), 10) || re.reps) : Array(re.sets).fill(re.reps);
    while (currentRepsArray.length < newSets) currentRepsArray.push(re.reps || 10);
    currentRepsArray.length = newSets;
    const updatedRepsList = re.repsList ? currentRepsArray.join(',') : undefined;

    setRoutine((prev) =>
      prev
        ? { ...prev, exercises: prev.exercises.map((item) => (item.id === re.id ? { ...item, sets: newSets, repsList: updatedRepsList ?? item.repsList } : item)) }
        : prev
    );

    try {
      await api.patch(`/api/routines/${id}/exercises/${re.id}`, { sets: newSets, ...(updatedRepsList ? { repsList: updatedRepsList } : {}) });
    } catch {
      fetchRoutine();
    }
  }

  async function handleUpdateSetReps(re: RoutineExercise, setIndex: number, value: number) {
    const currentArray = getRepsArray(re);
    currentArray[setIndex] = value;
    const newRepsList = currentArray.join(',');

    setRoutine((prev) =>
      prev ? { ...prev, exercises: prev.exercises.map((item) => (item.id === re.id ? { ...item, repsList: newRepsList, reps: currentArray[0] } : item)) } : prev
    );

    try {
      await api.patch(`/api/routines/${id}/exercises/${re.id}`, { repsList: newRepsList, reps: currentArray[0] });
    } catch {
      fetchRoutine();
    }
  }

  function enterReorderMode() {
    if (!routine) return;
    setOrderedExercises([...routine.exercises]);
    setIsReordering(true);
  }

  function cancelReorderMode() {
    setIsReordering(false);
  }

  function handleReorderMove(itemId: string, targetIndex: number) {
    setOrderedExercises((prev) => {
      const currentIndex = prev.findIndex((e) => e.id === itemId);
      if (currentIndex === -1) return prev;
      const clamped = Math.max(0, Math.min(prev.length - 1, targetIndex));
      if (clamped === currentIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(clamped, 0, moved);
      return next;
    });
  }

  async function handleConfirmReorder() {
    if (!routine) return;
    setIsSavingOrder(true);
    const finalOrder = orderedExercises;
    setRoutine((prev) => (prev ? { ...prev, exercises: finalOrder } : prev));
    setIsReordering(false);
    try {
      await api.patch(`/api/routines/${id}/reorder`, {
        orderUpdates: finalOrder.map((ex, i) => ({ id: ex.id, order: i })),
      });
    } catch {
      Alert.alert('Error', 'No se pudo guardar el nuevo orden.');
      fetchRoutine();
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function handleExportPdf() {
    if (!routine) return;
    setIsExportingPdf(true);
    try {
      const rows = routine.exercises
        .map(
          (re) => `
            <tr>
              <td>${re.exercise.name}</td>
              <td>${re.exercise.muscleGroup}${re.exercise.equipment ? ` • ${re.exercise.equipment}` : ''}</td>
              <td>${re.sets}</td>
              <td>${re.repsList || re.reps}</td>
              <td>${re.lastHistory || 'Sin registros previos'}</td>
            </tr>`
        )
        .join('');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
              h1 { color: #0891b2; font-size: 22px; margin-bottom: 2px; }
              p.subtitle { color: #64748b; font-size: 11px; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; color: #475569; }
              td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
            </style>
          </head>
          <body>
            <h1>FitWe</h1>
            <p class="subtitle">Plan de Entrenamiento — ${routine.name}</p>
            <p class="subtitle">Creada el ${new Date(routine.createdAt).toLocaleDateString('es-ES')}</p>
            <table>
              <thead>
                <tr><th>Ejercicio</th><th>Grupo</th><th>Series</th><th>Repeticiones</th><th>Historial</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Rutina ${routine.name}` });
      }
    } catch {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleStartWorkout() {
    if (!routine) return;
    setIsStarting(true);
    try {
      const session = await api.post('/api/sessions/start', { routineId: routine.id });
      router.push({ pathname: '/workout/live/[sessionId]', params: { sessionId: session.id } });
    } catch {
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento.');
    } finally {
      setIsStarting(false);
    }
  }

  const filteredCatalog = useMemo(() => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return exerciseCatalog.filter((ex) => {
      const matchesSearch = normalize(ex.name).includes(normalize(searchQuery));
      const matchesMuscle = filterMuscle ? ex.muscleGroup === filterMuscle : true;
      const matchesEquipment = filterEquipment ? ex.equipment === filterEquipment : true;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exerciseCatalog, searchQuery, filterMuscle, filterEquipment]);

  if (isLoading || !routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        {isEditingName ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              autoFocus
              style={{ flex: 1, backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 12, height: 40, fontWeight: 'bold' }}
            />
            <TouchableOpacity onPress={handleRenameRoutine} disabled={isSavingName} style={{ padding: 8, backgroundColor: Palette.emerald500, borderRadius: 12 }}>
              {isSavingName ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingName(false)} style={{ padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 12 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => {
              setTempName(routine.name);
              setIsEditingName(true);
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary, flexShrink: 1 }} numberOfLines={1}>
              {routine.name}
            </Text>
            <Edit2 size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40 }} scrollEnabled={!isReordering}>
        {!isReordering && (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={openPicker}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceAlt, height: 46, borderRadius: 14 }}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Añadir Ejercicio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartWorkout}
                disabled={isStarting || routine.exercises.length === 0}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.primary,
                  height: 46,
                  borderRadius: 14,
                  opacity: isStarting || routine.exercises.length === 0 ? 0.5 : 1,
                }}
              >
                {isStarting ? <ActivityIndicator size="small" color="#fff" /> : <Play size={15} color="#fff" fill="#fff" />}
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Comenzar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              <TouchableOpacity
                onPress={enterReorderMode}
                disabled={routine.exercises.length < 2}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, opacity: routine.exercises.length < 2 ? 0.4 : 1 }}
              >
                <ArrowUpDown size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}>Reordenar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExportPdf}
                disabled={isExportingPdf || routine.exercises.length === 0}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, opacity: isExportingPdf || routine.exercises.length === 0 ? 0.4 : 1 }}
              >
                {isExportingPdf ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Download size={14} color={colors.textSecondary} />}
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}>Exportar PDF</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {isReordering && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity onPress={cancelReorderMode} style={{ flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmReorder}
              disabled={isSavingOrder}
              style={{ flex: 1, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: isSavingOrder ? 0.6 : 1 }}
            >
              {isSavingOrder ? <ActivityIndicator size="small" color="#fff" /> : <Check size={15} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Guardar Orden</Text>
            </TouchableOpacity>
          </View>
        )}

        {isReordering ? (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12, textAlign: 'center' }}>
            Mantén pulsado el icono de agarre y arrastra para reordenar
          </Text>
        ) : null}

        {isReordering ? (
          <View style={{ position: 'relative' }}>
            {orderedExercises.map((re, index) => (
              <DraggableExerciseRow key={re.id} item={re} index={index} colors={colors} onMove={handleReorderMove} />
            ))}
          </View>
        ) : routine.exercises.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border }}>
            <Dumbbell size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>Rutina vacía</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Añade ejercicios para empezar.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {routine.exercises.map((re) => {
              const isCardio = re.exercise.muscleGroup.toLowerCase() === 'cardio';
              return (
                <View key={re.id} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <ExerciseAvatar imageUrl={re.exercise.imageUrl} equipment={re.exercise.equipment} muscleGroup={re.exercise.muscleGroup} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{re.exercise.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                        {re.exercise.muscleGroup}
                        {re.exercise.equipment ? ` • ${re.exercise.equipment}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => openReplacePicker(re)} style={{ padding: 6 }}>
                      <RefreshCcw size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteExercise(re.id)} style={{ padding: 6 }}>
                      <Trash2 size={16} color={Palette.red500} />
                    </TouchableOpacity>
                  </View>

                  {!isCardio && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>Series</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 4 }}>
                          <TouchableOpacity onPress={() => handleUpdateSets(re, -1)} disabled={re.sets <= 1} style={{ padding: 4, opacity: re.sets <= 1 ? 0.3 : 1 }}>
                            <Minus size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, minWidth: 18, textAlign: 'center' }}>{re.sets}</Text>
                          <TouchableOpacity onPress={() => handleUpdateSets(re, 1)} disabled={re.sets >= 9} style={{ padding: 4, opacity: re.sets >= 9 ? 0.3 : 1 }}>
                            <Plus size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {re.repsList && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {getRepsArray(re).map((repVal, idx) => (
                            <View key={idx} style={{ alignItems: 'center', backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, padding: 6, minWidth: 56 }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>S{idx + 1}</Text>
                              <TextInput
                                value={repVal.toString()}
                                onChangeText={(v) => {
                                  const num = Math.min(99, Math.max(1, parseInt(v, 10) || 1));
                                  handleUpdateSetReps(re, idx, num);
                                }}
                                keyboardType="numeric"
                                style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', minWidth: 24, padding: 0 }}
                              />
                            </View>
                          ))}
                        </View>
                      )}

                      {re.lastHistory && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 10 }}>{re.lastHistory}</Text>}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
                {step === 'picker' ? 'Biblioteca de Ejercicios' : 'Configurar Ejercicio'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {step === 'picker' ? (
              <>
                <View style={{ padding: 16, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 14, paddingHorizontal: 12 }}>
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Buscar ejercicio..."
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, color: colors.textPrimary, height: 44 }}
                    />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {MUSCLE_GROUPS.map((m) => (
                        <FilterChip key={m || 'todos-m'} label={m || 'Todos'} active={filterMuscle === m} onPress={() => setFilterMuscle(m)} colors={colors} />
                      ))}
                    </View>
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {EQUIPMENT_TYPES.map((eq) => (
                        <FilterChip key={eq || 'todos-eq'} label={eq || 'Todos'} active={filterEquipment === eq} onPress={() => setFilterEquipment(eq)} colors={colors} />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 20, gap: 8 }}>
                  {filteredCatalog.map((ex) => (
                    <TouchableOpacity
                      key={ex.id}
                      onPress={() => selectExerciseForConfig(ex)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken }}
                    >
                      <ExerciseAvatar imageUrl={ex.imageUrl} equipment={ex.equipment} muscleGroup={ex.muscleGroup} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{ex.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          {ex.muscleGroup}
                          {ex.equipment ? ` • ${ex.equipment}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              selectedExercise && (
                <ScrollView contentContainerStyle={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 16, marginBottom: 18 }}>
                    <ExerciseAvatar imageUrl={selectedExercise.imageUrl} equipment={selectedExercise.equipment} muscleGroup={selectedExercise.muscleGroup} size={48} />
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{selectedExercise.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {selectedExercise.muscleGroup}
                        {selectedExercise.equipment ? ` • ${selectedExercise.equipment}` : ''}
                      </Text>
                    </View>
                  </View>

                  {selectedExercise.muscleGroup.toLowerCase() === 'cardio' ? (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 18 }}>Cardio: 1 sesión de entrenamiento</Text>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>Definir reps objetivo por serie</Text>
                        <TouchableOpacity
                          onPress={() => setHasTargetReps((v) => !v)}
                          style={{ width: 42, height: 24, borderRadius: 12, backgroundColor: hasTargetReps ? colors.primary : colors.surfaceAlt, justifyContent: 'center', padding: 2 }}
                        >
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: hasTargetReps ? 'flex-end' : 'flex-start' }} />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>Series Objetivo</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                          <TouchableOpacity onPress={() => setSets((s) => Math.max(1, s - 1))} disabled={sets <= 1} style={{ opacity: sets <= 1 ? 0.3 : 1 }}>
                            <Minus size={15} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary, minWidth: 18, textAlign: 'center' }}>{sets}</Text>
                          <TouchableOpacity onPress={() => setSets((s) => Math.min(9, s + 1))} disabled={sets >= 9} style={{ opacity: sets >= 9 ? 0.3 : 1 }}>
                            <Plus size={15} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {hasTargetReps && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                          {Array.from({ length: sets }).map((_, idx) => (
                            <View key={idx} style={{ alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 8, minWidth: 60 }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Serie {idx + 1}</Text>
                              <TextInput
                                value={(repsPerSet[idx] ?? 10).toString()}
                                onChangeText={(v) => {
                                  const num = Math.min(99, Math.max(1, parseInt(v, 10) || 1));
                                  setRepsPerSet((prev) => {
                                    const next = [...prev];
                                    next[idx] = num;
                                    return next;
                                  });
                                }}
                                keyboardType="numeric"
                                style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', minWidth: 28, padding: 0 }}
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setStep('picker')} style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Volver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddExercise}
                      disabled={isSubmitting}
                      style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
                    >
                      {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Añadir a Rutina</Text>}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? '#fff' : colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}

function DraggableExerciseRow({
  item,
  index,
  colors,
  onMove,
}: {
  item: RoutineExercise;
  index: number;
  colors: any;
  onMove: (itemId: string, targetIndex: number) => void;
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
        dragY.setValue(gesture.dy);
        const targetIndex = Math.round((startIndexRef.current * REORDER_ROW_HEIGHT + gesture.dy) / REORDER_ROW_HEIGHT);
        onMove(item.id, targetIndex);
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
          gap: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isDragging ? colors.primary : colors.border,
          borderRadius: 16,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <ExerciseAvatar imageUrl={item.exercise.imageUrl} equipment={item.exercise.equipment} muscleGroup={item.exercise.muscleGroup} size={32} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
          {item.exercise.name}
        </Text>
        <View {...panResponder.panHandlers} style={{ padding: 8 }}>
          <GripVertical size={18} color={colors.textMuted} />
        </View>
      </View>
    </Animated.View>
  );
}
