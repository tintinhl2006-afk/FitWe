import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * Shared presentational primitives used across mobile screens, so screens don't
 * each redefine their own Card/Field/Chip/etc. with slightly different styles.
 * All pull colors from ThemeContext directly — callers never need to pass `colors`.
 */

export function Card({ children, style, padding = 18 }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; padding?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: 20, padding, borderWidth: 1, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function IconBadge({ children, bg, size = 40 }: { children: React.ReactNode; bg?: string; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }, style]}>
      {children}
    </Text>
  );
}

export function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: flex ? 1 : undefined }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 12, paddingHorizontal: 12, height: 44 }, props.style]}
    />
  );
}

export function Chip({ label, active, onPress, activeColor }: { label: string; active: boolean; onPress: () => void; activeColor?: string }) {
  const { colors } = useAppTheme();
  const color = activeColor ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? color : colors.surface,
        borderWidth: 1,
        borderColor: active ? color : colors.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? '#fff' : colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OptionCard({ label, desc, active, onPress }: { label: string; desc: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '47%',
        padding: 12,
        borderRadius: 16,
        backgroundColor: active ? colors.primarySoft : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        minHeight: 64,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{label}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{desc}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border }}>
      <View style={{ marginBottom: 12 }}>{icon}</View>
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>{subtitle}</Text>
    </View>
  );
}

export function Stepper({ value, onDecrement, onIncrement, min = 1, max = 99 }: { value: number; onDecrement: () => void; onIncrement: () => void; min?: number; max?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
      <TouchableOpacity onPress={onDecrement} disabled={value <= min} style={{ padding: 4, opacity: value <= min ? 0.3 : 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>-</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary, minWidth: 20, textAlign: 'center' }}>{value}</Text>
      <TouchableOpacity onPress={onIncrement} disabled={value >= max} style={{ padding: 4, opacity: value >= max ? 0.3 : 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
