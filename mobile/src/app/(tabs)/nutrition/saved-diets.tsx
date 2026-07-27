import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Folder, Check, Trash2, Edit2, X } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Card, EmptyState, TextField } from '../../../components/ui';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';

interface SavedDietItem {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantityGrams: number;
  mealType: string;
}

interface SavedDiet {
  id: string;
  name: string;
  items: SavedDietItem[];
  updatedAt: string;
}

function dietTotals(diet: SavedDiet) {
  return diet.items.reduce(
    (acc, item) => {
      const factor = item.quantityGrams / 100;
      return {
        calories: acc.calories + item.calories * factor,
        protein: acc.protein + item.protein * factor,
      };
    },
    { calories: 0, protein: 0 }
  );
}

export default function SavedDietsScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const [diets, setDiets] = useState<SavedDiet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const targetDate = date || new Date().toISOString().split('T')[0];

  async function fetchDiets() {
    setIsLoading(true);
    try {
      const data = await api.get('/api/user/nutrition/saved-diets');
      setDiets(Array.isArray(data) ? data : []);
    } catch {
      setDiets([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDiets();
  }, []);

  function handleApply(diet: SavedDiet) {
    Alert.alert(
      'Aplicar Plantilla',
      `Esto sustituirá tu diario del ${targetDate} por los alimentos de "${diet.name}". ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            setApplyingId(diet.id);
            try {
              await api.post(`/api/user/nutrition/saved-diets/${diet.id}/apply`, { date: targetDate });
              router.replace('/nutrition');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo aplicar la plantilla.');
            } finally {
              setApplyingId(null);
            }
          },
        },
      ]
    );
  }

  function handleDelete(diet: SavedDiet) {
    Alert.alert('Eliminar Plantilla', `¿Seguro que quieres borrar "${diet.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(diet.id);
          try {
            await api.delete(`/api/user/nutrition/saved-diets/${diet.id}`);
            setDiets((prev) => prev.filter((d) => d.id !== diet.id));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la plantilla.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  function startRename(diet: SavedDiet) {
    setRenamingId(diet.id);
    setRenameValue(diet.name);
  }

  async function confirmRename() {
    if (!renamingId || !renameValue.trim()) return;
    setIsSavingName(true);
    try {
      await api.put(`/api/user/nutrition/saved-diets/${renamingId}`, { name: renameValue.trim() });
      setDiets((prev) => prev.map((d) => (d.id === renamingId ? { ...d, name: renameValue.trim() } : d)));
      setRenamingId(null);
    } catch {
      Alert.alert('Error', 'No se pudo renombrar la plantilla.');
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Mis Dietas Guardadas</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
          {diets.length === 0 ? (
            <EmptyState
              icon={<Folder size={32} color={colors.textMuted} />}
              title="No tienes plantillas guardadas"
              subtitle="Guarda tu diario de hoy o un menú generado con IA como plantilla para reutilizarlo más adelante."
            />
          ) : (
            <View style={{ gap: 12 }}>
              {diets.map((diet) => {
                const totals = dietTotals(diet);
                const isRenaming = renamingId === diet.id;
                return (
                  <Card key={diet.id} padding={16}>
                    {isRenaming ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <TextField value={renameValue} onChangeText={setRenameValue} autoFocus />
                        </View>
                        <TouchableOpacity onPress={confirmRename} disabled={isSavingName} style={{ padding: 8, backgroundColor: Palette.emerald500, borderRadius: 12 }}>
                          {isSavingName ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRenamingId(null)} style={{ padding: 8, backgroundColor: colors.surfaceAlt, borderRadius: 12 }}>
                          <X size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{diet.name}</Text>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                            {diet.items.length} alimentos · {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g P
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => startRename(diet)} style={{ padding: 6 }}>
                          <Edit2 size={15} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleApply(diet)}
                        disabled={applyingId === diet.id}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          height: 42,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          opacity: applyingId === diet.id ? 0.6 : 1,
                        }}
                      >
                        {applyingId === diet.id ? <ActivityIndicator size="small" color="#fff" /> : <Check size={14} color="#fff" />}
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Aplicar a Hoy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(diet)}
                        disabled={deletingId === diet.id}
                        style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                      >
                        {deletingId === diet.id ? <ActivityIndicator size="small" color={Palette.red500} /> : <Trash2 size={16} color={Palette.red500} />}
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
