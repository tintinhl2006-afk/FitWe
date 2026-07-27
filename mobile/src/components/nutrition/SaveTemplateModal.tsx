import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { Field, TextField } from '../ui';
import { api } from '../../lib/apiClient';

export interface SavedDietItemInput {
  foodName: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantityGrams: number;
  mealType: string;
}

interface SaveTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  items: SavedDietItemInput[];
  defaultName?: string;
}

/** Shared "save as diet template" flow, used from both the daily diary and the AI planner preview. */
export function SaveTemplateModal({ visible, onClose, onSaved, items, defaultName = '' }: SaveTemplateModalProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Introduce un nombre para la plantilla.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Sin alimentos', 'No hay alimentos que guardar en esta plantilla.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/api/user/nutrition/saved-diets', { name: name.trim(), items });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar la plantilla.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Guardar como Plantilla</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Field label="Nombre de la Plantilla">
            <TextField value={name} onChangeText={setName} placeholder="Ej. Día de entreno alto en proteína" autoFocus />
          </Field>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{ marginTop: 16, height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: isSaving ? 0.6 : 1 }}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Guardar Plantilla</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
