import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Save } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { usePreferences } from '../../../../context/PreferencesContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { api } from '../../../../lib/apiClient';

type WeightUnit = 'kg' | 'lbs';
type DistanceUnit = 'km' | 'mi';
type MeasurementUnit = 'cm' | 'in';

export default function UnitsSettingsScreen() {
  const { colors } = useAppTheme();
  const prefs = usePreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(prefs.weightUnit);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(prefs.distanceUnit);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(prefs.measurementUnit);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (prefs.isLoading || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    setWeightUnit(prefs.weightUnit);
    setDistanceUnit(prefs.distanceUnit);
    setMeasurementUnit(prefs.measurementUnit);
  }, [prefs.isLoading, prefs.weightUnit, prefs.distanceUnit, prefs.measurementUnit]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.patch('/api/settings/units', { weightUnit, distanceUnit, measurementUnit });
      await prefs.refreshPreferences();
      Alert.alert('Unidades Guardadas', 'Tus preferencias se han actualizado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron guardar las unidades.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Unidades de Medida" colors={colors} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <UnitGroup
          colors={colors}
          title="Unidad de Peso"
          subtitle="Usada para el peso corporal y los ejercicios de fuerza."
          options={[
            { value: 'kg', label: 'Kilogramos (kg)' },
            { value: 'lbs', label: 'Libras (lbs)' },
          ]}
          value={weightUnit}
          onChange={(v) => setWeightUnit(v as WeightUnit)}
        />
        <UnitGroup
          colors={colors}
          title="Unidad de Distancia"
          subtitle="Usada para ejercicios de cardio como correr o bicicleta."
          options={[
            { value: 'km', label: 'Kilómetros (km)' },
            { value: 'mi', label: 'Millas (mi)' },
          ]}
          value={distanceUnit}
          onChange={(v) => setDistanceUnit(v as DistanceUnit)}
        />
        <UnitGroup
          colors={colors}
          title="Unidad de Medida"
          subtitle="Usada para tu altura y medidas corporales."
          options={[
            { value: 'cm', label: 'Centímetros (cm)' },
            { value: 'in', label: 'Pulgadas (in)' },
          ]}
          value={measurementUnit}
          onChange={(v) => setMeasurementUnit(v as MeasurementUnit)}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            height: 50,
            borderRadius: 16,
            marginTop: 8,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Save size={16} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Guardar Cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function UnitGroup({
  colors,
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  colors: any;
  title: string;
  subtitle: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3, marginBottom: 12 }}>{subtitle}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primarySoft : colors.surfaceAlt,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: selected ? colors.primaryAccent : colors.textPrimary }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
