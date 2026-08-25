import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/apiClient';
import { useAuth } from './AuthContext';

const ACTIVE_SESSION_KEY = 'fitwe_active_workout_session_id';

interface LiveWorkoutContextType {
  /** The in-progress WorkoutSession id, or null if no workout is currently running. */
  activeSessionId: string | null;
  /** True while the live workout is collapsed to the mini-bar instead of full-screen. */
  isMinimized: boolean;
  /** Marks a freshly-started session as the active one and opens it full-screen. */
  startSession: (sessionId: string) => void;
  minimize: () => void;
  expand: () => void;
  /** Clears the active session (after it's saved or discarded server-side). */
  endSession: () => void;
}

const LiveWorkoutContext = createContext<LiveWorkoutContextType | undefined>(undefined);

export function LiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // On login (or app relaunch while already logged in), check for a workout session
  // that was left running — e.g. the app was closed or crashed mid-workout — and
  // resume it minimized so the user isn't dropped back into it full-screen unannounced.
  useEffect(() => {
    if (!user) {
      setActiveSessionId(null);
      return;
    }
    (async () => {
      try {
        const storedId = await SecureStore.getItemAsync(ACTIVE_SESSION_KEY);
        if (!storedId) return;
        const session = await api.get(`/api/sessions/${storedId}`);
        if (session && !session.endTime) {
          setActiveSessionId(storedId);
          setIsMinimized(true);
        } else {
          await SecureStore.deleteItemAsync(ACTIVE_SESSION_KEY);
        }
      } catch {
        await SecureStore.deleteItemAsync(ACTIVE_SESSION_KEY).catch(() => {});
      }
    })();
  }, [user]);

  function startSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setIsMinimized(false);
    SecureStore.setItemAsync(ACTIVE_SESSION_KEY, sessionId).catch(() => {});
  }

  function minimize() {
    setIsMinimized(true);
  }

  function expand() {
    setIsMinimized(false);
  }

  function endSession() {
    setActiveSessionId(null);
    setIsMinimized(false);
    SecureStore.deleteItemAsync(ACTIVE_SESSION_KEY).catch(() => {});
  }

  return (
    <LiveWorkoutContext.Provider value={{ activeSessionId, isMinimized, startSession, minimize, expand, endSession }}>
      {children}
    </LiveWorkoutContext.Provider>
  );
}

export function useLiveWorkout() {
  const ctx = useContext(LiveWorkoutContext);
  if (!ctx) throw new Error('useLiveWorkout must be used within a LiveWorkoutProvider');
  return ctx;
}
