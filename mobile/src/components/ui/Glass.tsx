import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { Glass } from '../../constants/theme';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
}

/**
 * Liquid-glass surface: real backdrop blur, a tint, a diagonal specular sheen and a
 * luminous 1px edge. Children render above the effect layers, so padding goes in `style`.
 */
export function GlassView({ children, style, radius = 24, intensity = 40 }: GlassViewProps) {
  const { theme } = useAppTheme();
  const glass = Glass[theme];
  const flat = StyleSheet.flatten(style) ?? {};
  return (
    <View
      style={[
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: glass.edge,
          overflow: 'hidden',
          shadowColor: glass.shadow,
          shadowOpacity: theme === 'dark' ? 0.4 : 0.16,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
        },
        flat,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={theme === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.tint }]} />
      <LinearGradient
        pointerEvents="none"
        colors={glass.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
