import React from 'react';
import { Stack } from 'expo-router';

export default function NutritionStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="generate-diet" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="saved-diets" />
    </Stack>
  );
}
