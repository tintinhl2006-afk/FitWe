import React from 'react';
import { Stack } from 'expo-router';
import { useSceneStyle } from '../../../components/ui/AmbientBackground';

export default function NutritionStackLayout() {
  const scene = useSceneStyle();
  return (
    <Stack screenOptions={{ contentStyle: scene, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="generate-diet" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="saved-diets" />
    </Stack>
  );
}
