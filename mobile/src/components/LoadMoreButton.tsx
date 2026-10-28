import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

interface LoadMoreButtonProps {
  onPress: () => void;
  isLoading: boolean;
  label?: string;
}

/** Shown under a paginated list when the last page came back full, i.e. there may be more. */
export function LoadMoreButton({ onPress, isLoading, label = 'Cargar más' }: LoadMoreButtonProps) {
  const { colors } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', paddingTop: 14 }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 11,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
