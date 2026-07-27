import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Save } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { api } from '../../../../lib/apiClient';

export default function PasswordSettingsScreen() {
  const { colors } = useAppTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  async function handleSave() {
    if (!current || !newPass) {
      Alert.alert('Campos requeridos', 'Introduce tu contraseña actual y la nueva.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/api/settings/password', { current, newPass });
      Alert.alert('Contraseña Actualizada', 'Tu contraseña se ha cambiado correctamente.');
      setCurrent('');
      setNewPass('');
      setConfirmPass('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'La contraseña actual no es correcta.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Cambiar Contraseña" colors={colors} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <Field colors={colors} label="Contraseña Actual">
          <TextInput
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, height: 48 }}
          />
        </Field>
        <Field colors={colors} label="Nueva Contraseña">
          <TextInput
            value={newPass}
            onChangeText={setNewPass}
            secureTextEntry
            style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, height: 48 }}
          />
        </Field>
        <Field colors={colors} label="Confirmar Nueva Contraseña">
          <TextInput
            value={confirmPass}
            onChangeText={setConfirmPass}
            secureTextEntry
            style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, height: 48 }}
          />
        </Field>

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
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Actualizar Contraseña</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ colors, label, children }: { colors: any; label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>{label}</Text>
      {children}
    </View>
  );
}
