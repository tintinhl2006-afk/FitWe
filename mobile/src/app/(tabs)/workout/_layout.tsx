import React from 'react';
import { Stack } from 'expo-router';
import { useSceneStyle } from '../../../components/ui/AmbientBackground';

export default function WorkoutStackLayout() {
  const scene = useSceneStyle();
  return (
    <Stack screenOptions={{ contentStyle: scene, headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="routine/[id]" />
      <Stack.Screen name="generate" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="exercise/[id]" />
    </Stack>
  );
}
