import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Save } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { api } from '../../../../lib/apiClient';

export default function AccountSettingsScreen() {
  const { colors } = useAppTheme();
  const { refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    api
      .get('/api/settings/profile')
      .then((data) => {
        setName(data?.name || '');
        setBio(data?.bio || '');
        setLink(data?.link || '');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.patch('/api/settings/profile', { name, bio, link });
      await refreshUser();
      Alert.alert('Perfil Actualizado', 'Tus datos se han guardado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Perfil Público" colors={colors} />
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
          <Field colors={colors} label="Nombre Completo">
            <TextInput
              value={name}
              onChangeText={setName}
              style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, height: 48 }}
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field colors={colors} label="Biografía">
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              placeholder="Un poco sobre ti y tus objetivos..."
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, height: 96, textAlignVertical: 'top' }}
            />
          </Field>

          <Field colors={colors} label="Enlace / Sitio Web">
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="https://tu-instagram.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
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
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Guardar Cambios</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
