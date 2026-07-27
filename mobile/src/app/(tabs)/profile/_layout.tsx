import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
