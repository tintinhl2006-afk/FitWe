import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, Share, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Ruler, Lock, Palette as PaletteIcon, Download, LogOut, ChevronRight, Building2, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { api } from '../../../../lib/apiClient';

export default function SettingsMenuScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await api.getText('/api/export/csv');
      await Share.share({ message: csv, title: 'fitwe_export.csv' });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo exportar tus datos.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleLogout() {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'ADVERTENCIA EXTREMA',
      '¿Estás absolutamente seguro de querer eliminar tu cuenta? Se borrarán TODOS tus entrenamientos, rutinas e historial para siempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Última confirmación', 'Esta acción NO se puede deshacer.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar Cuenta',
                style: 'destructive',
                onPress: async () => {
                  setIsDeleting(true);
                  try {
                    await api.post('/api/settings/delete-account');
                    await logout();
                    router.replace('/(auth)/login');
                  } catch (e) {
                    Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
                  } finally {
                    setIsDeleting(false);
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Configuración" colors={colors} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 20 }}>
          <MenuRow colors={colors} icon={<User size={18} color={colors.primary} />} label="Perfil Público" onPress={() => router.push('/profile/settings/account')} />
          <MenuRow colors={colors} icon={<Ruler size={18} color={colors.primary} />} label="Unidades de Medida" onPress={() => router.push('/profile/settings/units')} />
          <MenuRow colors={colors} icon={<PaletteIcon size={18} color={colors.primary} />} label="Apariencia" onPress={() => router.push('/profile/settings/appearance')} />
          <MenuRow colors={colors} icon={<Lock size={18} color={colors.primary} />} label="Cambiar Contraseña" onPress={() => router.push('/profile/settings/password')} />
          <MenuRow colors={colors} icon={<Building2 size={18} color={colors.primary} />} label="Mi Gimnasio" onPress={() => router.push('/profile/settings/gym')} />
          <MenuRow
            colors={colors}
            icon={isExporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Download size={18} color={colors.primary} />}
            label="Exportar Mis Datos (CSV)"
            onPress={handleExport}
            last
          />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 52,
            borderRadius: 18,
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.25)',
          }}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: 'bold' }}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 46,
            borderRadius: 18,
            marginTop: 10,
            opacity: isDeleting ? 0.6 : 1,
          }}
        >
          {isDeleting ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Trash2 size={14} color={colors.textMuted} />}
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Eliminar mi cuenta permanentemente</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ colors, icon, label, onPress, last }: { colors: any; icon: React.ReactNode; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon}
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
