import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Building2, MapPin, Save } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { Card, Field, TextField } from '../../../../components/ui';
import { api } from '../../../../lib/apiClient';

export default function GymSettingsScreen() {
  const { colors } = useAppTheme();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gymName, setGymName] = useState<string | null>(null);
  const [gymLocation, setGymLocation] = useState<string | null>(null);
  const [gymCode, setGymCode] = useState('');

  async function fetchGym() {
    try {
      const data = await api.get('/api/user/link-gym');
      setGymName(data.gymName);
      setGymLocation(data.gymLocation);
    } catch {
      // keep defaults
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchGym();
  }, []);

  function handleLinkGym() {
    if (gymCode.trim().length !== 6) {
      Alert.alert('Código inválido', 'El código del gimnasio debe tener exactamente 6 caracteres.');
      return;
    }

    const action = gymName ? 'cambiar' : 'vincularte';
    Alert.alert(
      'Confirmar',
      `¿Confirmas que deseas ${action} de gimnasio? Si tienes una suscripción activa o reservas programadas en tu centro actual, serán canceladas y desactivadas automáticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsSaving(true);
            try {
              const data = await api.post('/api/user/link-gym', { gymCode: gymCode.trim() });
              Alert.alert('Listo', data.message || 'Vinculación realizada correctamente.');
              setGymCode('');
              await fetchGym();
              await refreshUser();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo vincular el gimnasio.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Mi Centro Deportivo" colors={colors} />
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
          <Card style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ height: 46, width: 46, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color={colors.primaryAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{gymName || 'Sin gimnasio vinculado'}</Text>
              {gymLocation && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <MapPin size={11} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{gymLocation}</Text>
                </View>
              )}
            </View>
          </Card>

          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 }}>
            {gymName ? 'Cambiar de Centro' : 'Vincular un Centro'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 14, lineHeight: 17 }}>
            Introduce el código de 6 caracteres que te ha facilitado tu gimnasio.
          </Text>

          <Field label="Código del Gimnasio">
            <TextField
              value={gymCode}
              onChangeText={(v) => setGymCode(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              placeholder="Ej. AB12CD"
            />
          </Field>

          <TouchableOpacity
            onPress={handleLinkGym}
            disabled={isSaving}
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 50,
              borderRadius: 14,
              backgroundColor: colors.primary,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Save size={16} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{gymName ? 'Cambiar de Centro' : 'Vincular Centro'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
