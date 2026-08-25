import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Trash2, ChevronUp } from 'lucide-react-native';
import { useLiveWorkout } from '../../context/LiveWorkoutContext';
import { Palette } from '../../constants/theme';
import { api } from '../../lib/apiClient';

// Matches the tab bar's own height, set in (tabs)/_layout.tsx.
const TAB_BAR_HEIGHT = 64;

/** Persistent pill shown above the tab bar whenever a live workout is running but
 * minimized — lets the user keep browsing the rest of the app without losing the session. */
export function MiniWorkoutBar() {
  const insets = useSafeAreaInsets();
  const { activeSessionId, isMinimized, expand, endSession } = useLiveWorkout();
  const [elapsed, setElapsed] = useState('00:00');
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSessionId) {
      setStartTime(null);
      return;
    }
    api
      .get(`/api/sessions/${activeSessionId}`)
      .then((data) => setStartTime(new Date(data.startTime).getTime()))
      .catch(() => {});
  }, [activeSessionId]);

  useEffect(() => {
    if (!startTime) return;
    function tick() {
      const diff = Math.max(0, Math.floor((Date.now() - startTime!) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!activeSessionId || !isMinimized) return null;

  function handleDiscard() {
    Alert.alert('Descartar Entrenamiento', '¿Estás seguro? No se guardará ninguna serie en tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/sessions/${activeSessionId}`);
          } catch {
            // Best-effort: close out regardless so the user isn't stuck.
          }
          endSession();
        },
      },
    ]);
  }

  return (
    <TouchableOpacity
      onPress={expand}
      activeOpacity={0.9}
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: TAB_BAR_HEIGHT + insets.bottom + 10,
        backgroundColor: '#0f172a',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      <View style={{ height: 34, width: 34, borderRadius: 12, backgroundColor: 'rgba(6,182,212,0.15)', alignItems: 'center', justifyContent: 'center' }}>
        <Dumbbell size={16} color={Palette.cyan400} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>Entrenamiento en curso</Text>
        <Text style={{ color: Palette.cyan400, fontSize: 11, fontWeight: 'bold', marginTop: 1 }}>{elapsed}</Text>
      </View>
      <TouchableOpacity onPress={handleDiscard} style={{ height: 30, width: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={15} color={Palette.red400} />
      </TouchableOpacity>
      <View style={{ height: 30, width: 30, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronUp size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}
