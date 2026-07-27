import React from 'react';
import { Stack } from 'expo-router';

export default function WorkoutStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="routine/[id]" />
      <Stack.Screen name="generate" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="live/[sessionId]" options={{ animation: 'fade' }} />
    </Stack>
  );
}
