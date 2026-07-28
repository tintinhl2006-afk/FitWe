import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Dumbbell, Trash2, Play, Sparkles, BicepsFlexed, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';

interface Routine {
  id: string;
  name: string;
  createdAt: string;
  exercises?: { exercise: { name: string } }[];
}

export default function WorkoutScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  async function fetchRoutines() {
    try {
      const res = await api.get('/api/routines');
      setRoutines(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Error al cargar rutinas:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    api
      .get('/api/user/subscription-status')
      .then((sub) => {
        const expired = sub.subscriptionEndDate ? new Date(sub.subscriptionEndDate) < new Date(sub.serverNow) : false;
        const active = sub.subscriptionStatus === 'ACTIVE' && !expired;
        setIsSubscriptionActive(active);
        if (active) fetchRoutines();
        else setIsLoading(false);
      })
      .catch(() => {
        setIsSubscriptionActive(false);
        setIsLoading(false);
      });
  }, []);

  async function handleCreateRoutine() {
    if (!newRoutineName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/routines', { name: newRoutineName.trim() });
      setNewRoutineName('');
      setIsCreating(false);
      await fetchRoutines();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al crear la rutina');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteRoutine(routine: Routine) {
    Alert.alert('Eliminar Rutina', '¿Seguro que quieres borrar esta rutina? Se perderán todos sus ejercicios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(routine.id);
          try {
            await api.delete(`/api/routines/${routine.id}`);
            await fetchRoutines();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar la rutina');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  async function handleStartWorkout(routine: Routine) {
    setStartingId(routine.id);
    try {
      const session = await api.post('/api/sessions/start', { routineId: routine.id });
      router.push({ pathname: '/workout/live/[sessionId]', params: { sessionId: session.id } });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar el entrenamiento.');
    } finally {
      setStartingId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Mis Rutinas</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Gestiona tus planes de entrenamiento personales.</Text>
          </View>
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/workout/generate')}
              disabled={!isSubscriptionActive}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.primarySoft,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                opacity: isSubscriptionActive ? 1 : 0.5,
              }}
            >
              <Sparkles size={14} color={colors.primaryAccent} />
              <Text style={{ color: colors.primaryAccent, fontSize: 12, fontWeight: 'bold' }}>Generar Rutinas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsCreating((v) => !v)}
              disabled={!isSubscriptionActive}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                opacity: isSubscriptionActive ? 1 : 0.5,
              }}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Nueva</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/workout/exercises')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 14,
            marginBottom: 18,
          }}
        >
          <View style={{ height: 34, width: 34, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <BicepsFlexed size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>Catálogo de Ejercicios</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>Explora ejercicios, tu historial y progresión</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {!isSubscriptionActive && (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              marginBottom: 18,
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
              Tu cuota ha caducado. Renuévala para poder crear y comenzar rutinas.
            </Text>
          </View>
        )}

        {isCreating && (
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginBottom: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>Crear Nueva Rutina</Text>
            <TextInput
              value={newRoutineName}
              onChangeText={setNewRoutineName}
              placeholder="Ej. Push Pull Legs"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsCreating(false);
                  setNewRoutineName('');
                }}
                style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateRoutine}
                disabled={isSubmitting || !newRoutineName.trim()}
                style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSubmitting || !newRoutineName.trim() ? 0.6 : 1 }}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : routines.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 48,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
            }}
          >
            <View style={{ height: 60, width: 60, borderRadius: 30, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Dumbbell size={28} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>No tienes rutinas</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>
              Crea tu primera rutina de entrenamiento para empezar a registrar tu progreso.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {routines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/workout/routine/[id]', params: { id: routine.id } })}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{routine.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                      {routine.exercises && routine.exercises.length > 0
                        ? routine.exercises.map((e) => e.exercise.name).join(', ')
                        : 'Sin ejercicios añadidos'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteRoutine(routine)} disabled={deletingId === routine.id} style={{ padding: 6 }}>
                    {deletingId === routine.id ? <ActivityIndicator size="small" color={Palette.red500} /> : <Trash2 size={18} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleStartWorkout(routine)}
                  disabled={startingId === routine.id || !isSubscriptionActive}
                  style={{
                    marginTop: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: colors.primary,
                    height: 46,
                    borderRadius: 14,
                    opacity: startingId === routine.id || !isSubscriptionActive ? 0.6 : 1,
                  }}
                >
                  {startingId === routine.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Play size={15} color="#fff" fill="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Empezar Entreno</Text>
                    </>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
