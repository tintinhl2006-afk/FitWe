import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ThemeColors } from '../constants/theme';

export function SettingsHeader({ title, colors }: { title: string; colors: ThemeColors }) {
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{title}</Text>
    </View>
  );
}
