import React from 'react';
import { Modal } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { PreferencesProvider } from '../context/PreferencesContext';
import { LiveWorkoutProvider, useLiveWorkout } from '../context/LiveWorkoutContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LiveWorkoutOverlay from '../components/workout/LiveWorkoutOverlay';
import { MiniWorkoutBar } from '../components/workout/MiniWorkoutBar';

function ThemedStack() {
  const { theme, colors } = useAppTheme();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

// Rendered at the app root (sibling to the tab navigator) so a live workout survives
// switching tabs, and its minimized pill floats above every screen — not just the
// Workout tab's own stack, which is what a route-based live-session screen would give us.
function GlobalLiveWorkout() {
  const { activeSessionId, isMinimized, minimize } = useLiveWorkout();

  return (
    <>
      <Modal
        visible={!!activeSessionId && !isMinimized}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={minimize}
      >
        {activeSessionId && <LiveWorkoutOverlay sessionId={activeSessionId} />}
      </Modal>
      <MiniWorkoutBar />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PreferencesProvider>
            <LiveWorkoutProvider>
              <ThemedStack />
              <GlobalLiveWorkout />
            </LiveWorkoutProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
