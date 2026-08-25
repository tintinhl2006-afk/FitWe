import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, BicepsFlexed, ChevronDown, Check, X } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Card, Field, TextField, Chip, EmptyState } from '../../../components/ui';
import { ExerciseAvatar } from '../../../components/workout/ExerciseAvatar';
import { api } from '../../../lib/apiClient';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
}

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Pierna', 'Brazo', 'Hombro', 'Core', 'Cardio'];
const EQUIPMENT_TYPES = ['Barra', 'Mancuernas', 'Máquina', 'Peso Corporal'];

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [openFilter, setOpenFilter] = useState<'muscle' | 'equipment' | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('Pecho');

  async function fetchExercises() {
    setIsLoading(true);
    try {
      const data = await api.get('/api/exercises');
      setExercises(Array.isArray(data) ? data : []);
    } catch {
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchExercises();
  }, []);

  async function handleCreateExercise() {
    if (!newName.trim()) {
      Alert.alert('Campo requerido', 'Introduce un nombre para el ejercicio.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/exercises', { name: newName.trim(), description: newDescription.trim(), muscleGroup: newMuscleGroup });
      setNewName('');
      setNewDescription('');
      setIsCreating(false);
      await fetchExercises();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear el ejercicio.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(query);
      const matchesMuscle = filterMuscle ? ex.muscleGroup === filterMuscle : true;
      const matchesEquipment = filterEquipment ? ex.equipment === filterEquipment : true;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, search, filterMuscle, filterEquipment]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary, flex: 1 }}>Catálogo de Ejercicios</Text>
        <TouchableOpacity onPress={() => setIsCreating((v) => !v)} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}>
        {isCreating && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 }}>Nuevo Ejercicio</Text>
            <View style={{ gap: 12 }}>
              <Field label="Nombre del ejercicio">
                <TextField value={newName} onChangeText={setNewName} placeholder="Ej. Press inclinado con barra" />
              </Field>
              <Field label="Grupo Muscular">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {MUSCLE_GROUPS.map((g) => (
                    <Chip key={g} label={g} active={newMuscleGroup === g} onPress={() => setNewMuscleGroup(g)} />
                  ))}
                </View>
              </Field>
              <Field label="Descripción (Opcional)">
                <TextField value={newDescription} onChangeText={setNewDescription} placeholder="Cómo realizar el ejercicio..." multiline style={{ height: 70, paddingTop: 10, textAlignVertical: 'top' }} />
              </Field>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setIsCreating(false)} style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateExercise}
                  disabled={isSubmitting}
                  style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Crear</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, marginBottom: 12 }}>
          <Search size={16} color={colors.textMuted} />
          <TextField value={search} onChangeText={setSearch} placeholder="Buscar por nombre..." style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <FilterSelectButton label="Grupo Muscular" value={filterMuscle || 'Todos'} colors={colors} onPress={() => setOpenFilter('muscle')} />
          <FilterSelectButton label="Equipamiento" value={filterEquipment || 'Todos'} colors={colors} onPress={() => setOpenFilter('equipment')} />
        </View>

        <FilterPickerModal
          visible={openFilter === 'muscle'}
          title="Grupo Muscular"
          options={MUSCLE_GROUPS}
          value={filterMuscle}
          onSelect={setFilterMuscle}
          onClose={() => setOpenFilter(null)}
          colors={colors}
        />
        <FilterPickerModal
          visible={openFilter === 'equipment'}
          title="Equipamiento"
          options={EQUIPMENT_TYPES}
          value={filterEquipment}
          onSelect={setFilterEquipment}
          onClose={() => setOpenFilter(null)}
          colors={colors}
        />

        {isLoading ? (
          <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BicepsFlexed size={32} color={colors.textMuted} />}
            title="No se encontraron ejercicios"
            subtitle={search ? 'Prueba con otros términos de búsqueda.' : 'Usa el botón + para añadir el primer ejercicio.'}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                onPress={() => router.push({ pathname: '/workout/exercise/[id]', params: { id: ex.id } })}
                activeOpacity={0.8}
              >
                <Card padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ExerciseAvatar imageUrl={ex.imageUrl} equipment={ex.equipment} muscleGroup={ex.muscleGroup} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {ex.muscleGroup}
                      {ex.equipment ? ` • ${ex.equipment}` : ''}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterSelectButton({ label, value, colors, onPress }: { label: string; value: string; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginTop: 1 }} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ChevronDown size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function FilterPickerModal({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, maxHeight: '70%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
            <PickerRow label="Todos" selected={!value} colors={colors} onPress={() => { onSelect(''); onClose(); }} />
            {options.map((opt) => (
              <PickerRow key={opt} label={opt} selected={value === opt} colors={colors} onPress={() => { onSelect(opt); onClose(); }} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PickerRow({ label, selected, colors, onPress }: { label: string; selected: boolean; colors: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12, backgroundColor: selected ? colors.primarySoft : 'transparent' }}
    >
      <Text style={{ fontSize: 14, fontWeight: selected ? '900' : '600', color: selected ? colors.primaryAccent : colors.textPrimary }}>{label}</Text>
      {selected && <Check size={16} color={colors.primaryAccent} />}
    </TouchableOpacity>
  );
}
