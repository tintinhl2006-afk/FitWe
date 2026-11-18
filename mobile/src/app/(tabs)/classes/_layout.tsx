import React from 'react';
import { Stack } from 'expo-router';
import { useSceneStyle } from '../../../components/ui/AmbientBackground';

export default function ClassesStackLayout() {
  const scene = useSceneStyle();
  return (
    <Stack screenOptions={{ contentStyle: scene, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
