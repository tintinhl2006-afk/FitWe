import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../../context/ThemeContext';
import { Glass } from '../../constants/theme';

/** Soft colour orbs behind every screen so the glass surfaces have something to refract. */
export function AmbientBackground() {
  const { theme, colors } = useAppTheme();
  const [a, b, c] = Glass[theme].orbs;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="orbA" cx="12%" cy="14%" r="70%">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={a} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="orbB" cx="100%" cy="42%" r="60%">
            <Stop offset="0" stopColor={b} />
            <Stop offset="1" stopColor={b} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="orbC" cx="40%" cy="96%" r="70%">
            <Stop offset="0" stopColor={c} />
            <Stop offset="1" stopColor={c} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#orbA)" />
        <Rect width="100%" height="100%" fill="url(#orbB)" />
        <Rect width="100%" height="100%" fill="url(#orbC)" />
      </Svg>
    </View>
  );
}

/**
 * Scene background for navigators. Native keeps scenes transparent (inactive screens are
 * detached, so the shared AmbientBackground shows through). On web inactive screens stay
 * mounted and only an opaque scene hides them, so each scene paints the same orbs itself.
 */
export function useSceneStyle(): ViewStyle {
  const { theme, colors } = useAppTheme();
  if (Platform.OS !== 'web') return { backgroundColor: 'transparent' };
  const [a, b, c] = Glass[theme].orbs;
  return {
    backgroundColor: colors.background,
    backgroundImage: `radial-gradient(70% 38% at 12% 14%, ${a}, transparent), radial-gradient(60% 34% at 100% 42%, ${b}, transparent), radial-gradient(70% 36% at 40% 96%, ${c}, transparent)`,
  } as ViewStyle;
}
