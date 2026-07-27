import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useAppTheme } from '../../../../context/ThemeContext';
import { SettingsHeader } from '../../../../components/SettingsHeader';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', icon: Sun, iconBg: '#ffedd5', iconColor: '#ea580c' },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon, iconColor: '#cbd5e1' },
  { value: 'system' as const, label: 'Sistema', icon: Smartphone, iconColor: '#64748b' },
];

export default function AppearanceSettingsScreen() {
  const { colors, preference, setPreference, theme } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <SettingsHeader title="Apariencia" colors={colors} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>Cambia el aspecto visual de la aplicación.</Text>

        <View style={{ gap: 12 }}>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = preference === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPreference(opt.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                }}
              >
                <View
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: opt.value === 'dark' ? '#1e293b' : opt.value === 'system' ? colors.surfaceAlt : opt.iconBg,
                  }}
                >
                  <Icon size={20} color={opt.iconColor} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 20 }}>
          Tema actual aplicado: {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
