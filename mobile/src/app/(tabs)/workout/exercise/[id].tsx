import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info, History, LineChart } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { usePreferences } from '../../../../context/PreferencesContext';
import { Card, EmptyState } from '../../../../components/ui';
import { ExerciseAvatar } from '../../../../components/workout/ExerciseAvatar';
import { Palette } from '../../../../constants/theme';
import { api } from '../../../../lib/apiClient';

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

interface ChartPoint {
  date: string;
  pesoMaximo: number;
  repeticionMaxima: number;
  volumenTotal: number;
}

type Tab = 'indicaciones' | 'historial' | 'estadisticas';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { weightUnit } = usePreferences();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('historial');

  useEffect(() => {
    async function load() {
      try {
        const [exData, histData] = await Promise.all([api.get(`/api/exercises/${id}`), api.get(`/api/exercises/${id}/history`)]);
        setExercise(exData);
        setHistory(histData.history || []);
        setChartData(histData.chartData || []);
      } catch {
        router.replace('/workout/exercises');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading || !exercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const isCardio = exercise.muscleGroup.toLowerCase() === 'cardio';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <ExerciseAvatar imageUrl={exercise.imageUrl} equipment={exercise.equipment} muscleGroup={exercise.muscleGroup} size={96} />
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginTop: 12, textAlign: 'center' }}>{exercise.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {exercise.muscleGroup}
            {exercise.equipment ? ` • ${exercise.equipment}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
          <TabButton icon={Info} label="Indicaciones" active={tab === 'indicaciones'} onPress={() => setTab('indicaciones')} />
          <TabButton icon={History} label="Historial" active={tab === 'historial'} onPress={() => setTab('historial')} />
          <TabButton icon={LineChart} label="Estadísticas" active={tab === 'estadisticas'} onPress={() => setTab('estadisticas')} />
        </View>

        {tab === 'indicaciones' &&
          (exercise.description ? (
            <Card>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>{exercise.description}</Text>
            </Card>
          ) : (
            <EmptyState icon={<Info size={28} color={colors.textMuted} />} title="Sin indicaciones" subtitle="No hay indicaciones guardadas para este ejercicio." />
          ))}

        {tab === 'historial' &&
          (history.length > 0 ? (
            <View style={{ gap: 12 }}>
              {history.map((session) => (
                <Card key={session.sessionId} padding={0}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: colors.surfaceSunken, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{session.routineName}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ padding: 8 }}>
                    {session.sets.map((set, idx) => (
                      <View key={set.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: idx < session.sets.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Serie {idx + 1}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textPrimary }}>
                          {isCardio ? `${set.reps} min` : `${set.weight} ${weightUnit} x ${set.reps}`}
                        </Text>
                        {!isCardio && <Text style={{ fontSize: 11, color: colors.textMuted }}>{Math.round(set.weight * set.reps)} vol.</Text>}
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState icon={<History size={28} color={colors.textMuted} />} title="Sin historial" subtitle="Aún no hay registros para este ejercicio." />
          ))}

        {tab === 'estadisticas' &&
          (chartData.length > 0 ? (
            <View style={{ gap: 16 }}>
              <StatChart title="Peso Máximo" data={chartData} dataKey="pesoMaximo" unit={weightUnit} color={Palette.cyan500} />
              <StatChart title="1RM Estimado" data={chartData} dataKey="repeticionMaxima" unit={weightUnit} color={Palette.violet600} />
              <StatChart title="Volumen Total" data={chartData} dataKey="volumenTotal" unit={weightUnit} color={Palette.emerald500} />
            </View>
          ) : (
            <EmptyState icon={<LineChart size={28} color={colors.textMuted} />} title="Sin datos suficientes" subtitle="Completa algunos entrenamientos primero." />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ icon: Icon, label, active, onPress }: { icon: typeof Info; label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: active ? colors.primary : 'transparent' }}
    >
      <Icon size={13} color={active ? colors.primaryAccent : colors.textMuted} />
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? colors.primaryAccent : colors.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatChart({ title, data, dataKey, unit, color }: { title: string; data: ChartPoint[]; dataKey: keyof ChartPoint; unit: string; color: string }) {
  const { colors } = useAppTheme();
  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values, 1);

  return (
    <Card>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 14 }}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 130, paddingHorizontal: 4 }}>
          {data.map((point, idx) => {
            const val = Number(point[dataKey]);
            const heightPct = Math.max((val / max) * 100, 4);
            return (
              <View key={idx} style={{ alignItems: 'center', width: 44 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 4 }}>{Math.round(val)}</Text>
                <View style={{ width: 20, height: `${heightPct}%`, backgroundColor: color, borderRadius: 5 }} />
                <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>
                  {point.date}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 10, textAlign: 'right' }}>Unidad: {unit}</Text>
    </Card>
  );
}
