import React from 'react';
import { Stack } from 'expo-router';
import { useSceneStyle } from '../../../components/ui/AmbientBackground';

export default function ProfileStackLayout() {
  const scene = useSceneStyle();
  return (
    <Stack screenOptions={{ contentStyle: scene, headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/account" />
      <Stack.Screen name="settings/units" />
      <Stack.Screen name="settings/password" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/gym" />
      <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
