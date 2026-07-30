import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Activity, Dumbbell, Accessibility, Target, BicepsFlexed } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { Palette } from '../../constants/theme';
import { API_BASE_URL } from '../../lib/apiClient';

// Exercise images in the catalog are seeded as paths relative to the web app's own
// domain (e.g. "/abducciones_maquina.jpeg", served from its public/ folder) — resolvable
// by a browser on web, but not a bare path on a native device with no origin to resolve against.
function resolveImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

interface ExerciseAvatarProps {
  imageUrl?: string | null;
  equipment?: string | null;
  muscleGroup: string;
  size?: number;
}

/**
 * Shows the exercise's real photo when available (matches the web app), falling back to a
 * muscle-group/equipment icon otherwise. Single source of truth for exercise iconography —
 * used by the routine builder, the live workout tracker, and the exercise picker.
 */
export function ExerciseAvatar({ imageUrl, equipment, muscleGroup, size = 40 }: ExerciseAvatarProps) {
  const { colors } = useAppTheme();
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: resolveImageUrl(imageUrl) }} style={{ width: size, height: size }} contentFit="cover" transition={150} alt="" />
      ) : (
        getFallbackIcon(equipment, muscleGroup, iconSize, colors.textMuted)
      )}
    </View>
  );
}

function getFallbackIcon(equipment: string | null | undefined, muscleGroup: string, size: number, mutedColor: string) {
  const group = muscleGroup.toLowerCase();
  const eq = equipment?.toLowerCase() || '';
  if (group === 'cardio') return <Activity size={size} color={Palette.cyan500} />;
  if (eq === 'mancuernas') return <Dumbbell size={size} color={Palette.amber500} />;
  if (eq === 'peso corporal') return <Accessibility size={size} color={Palette.emerald500} />;
  if (eq === 'barra' || eq === 'máquina' || eq === 'polea') return <Target size={size} color={Palette.cyan500} />;
  return <BicepsFlexed size={size} color={mutedColor} />;
}
