import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  User,
  Settings,
  QrCode,
  Clock,
  Calendar,
  Activity,
  Dumbbell,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { usePreferences } from '../../../context/PreferencesContext';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';

const { width } = Dimensions.get('window');
const QR_LIFETIME_SECONDS = 20;

interface SetEntry {
  weight: number;
  reps: number;
  isCompleted: boolean;
  exercise: { name: string; muscleGroup: string; equipment: string | null };
}

interface SessionEntry {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
  sets: SetEntry[];
}

interface ProfileData {
  user: { name: string; email: string; image: string | null };
  stats: { totalWeeklyMinutes: number; weeklySessionsCount: number; weeklyChartData: { day: string; minutos: number }[] };
  monthlyDates: string[];
  recentSessions: SessionEntry[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { weightUnit } = usePreferences();

  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<SessionEntry | null>(null);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(QR_LIFETIME_SECONDS);

  async function fetchProfile() {
    try {
      setData(await api.get('/api/profile'));
    } catch (e) {
      console.error('Error al cargar el perfil:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchQrToken() {
    setIsQrLoading(true);
    try {
      const res = await api.get('/api/user/access-token');
      setQrToken(res.token);
      setQrTimeLeft(QR_LIFETIME_SECONDS);
    } catch {
      setQrToken(null);
    } finally {
      setIsQrLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!isQrOpen) {
      setQrToken(null);
      return;
    }
    fetchQrToken();
  }, [isQrOpen]);

  useEffect(() => {
    if (!isQrOpen || !qrToken) return;
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQrToken();
          return QR_LIFETIME_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQrOpen, qrToken]);

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const activeDays = new Set(data.monthlyDates.map((d) => new Date(d).getDate()));

  const hoursTrained = Math.floor(data.stats.totalWeeklyMinutes / 60);
  const minsTrained = data.stats.totalWeeklyMinutes % 60;
  const maxMinutes = Math.max(...data.stats.weeklyChartData.map((d) => d.minutos), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
          <TouchableOpacity
            onPress={() => router.push('/profile/settings')}
            style={{ height: 38, width: 38, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              height: 96,
              width: 96,
              borderRadius: 48,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 3,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <User size={44} color={colors.textMuted} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginTop: 12 }}>{data.user.name}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{data.user.email}</Text>

          <TouchableOpacity
            onPress={() => setIsQrOpen(true)}
            style={{
              marginTop: 16,
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <QrCode size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Mi Código QR de Acceso
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Time Chart */}
        <Card colors={colors} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={14} color={colors.primaryAccent} />
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tiempo esta semana
            </Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 14 }}>
            {hoursTrained}<Text style={{ fontSize: 15, color: colors.textMuted }}>h </Text>
            {minsTrained}<Text style={{ fontSize: 15, color: colors.textMuted }}>m</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
            {data.stats.weeklyChartData.map((entry, idx) => {
              const hasTrained = entry.minutos > 0;
              const heightPct = hasTrained ? Math.max((entry.minutos / maxMinutes) * 100, 10) : 10;
              return (
                <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 18, height: `${heightPct}%`, borderRadius: 5, backgroundColor: hasTrained ? colors.primary : colors.surfaceAlt }} />
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: hasTrained ? colors.textPrimary : colors.textMuted, marginTop: 6, textTransform: 'capitalize' }}>
                    {entry.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Activity Calendar */}
        <Card colors={colors} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color={colors.primaryAccent} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Actividad del Mes
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primaryAccent, textTransform: 'uppercase' }}>
                {activeDays.size} sesiones
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', fontSize: 10, fontWeight: '900', color: colors.textMuted, marginBottom: 6 }}>
                {d}
              </Text>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
            ))}
            {calendarDays.map((day) => (
              <View key={day} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: activeDays.has(day) ? colors.primary : colors.surfaceAlt,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeDays.has(day) ? '#fff' : colors.textMuted }}>{day}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* History */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Activity size={14} color={colors.primaryAccent} />
          <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Historial de Entrenamientos
          </Text>
        </View>

        {data.recentSessions.length === 0 ? (
          <Card colors={colors} style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Dumbbell size={28} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10, fontWeight: '600' }}>
              Aún no hay registros de entrenamiento.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {data.recentSessions.map((session) => (
              <TouchableOpacity key={session.id} activeOpacity={0.8} onPress={() => setExpandedSession(session)}>
                <Card colors={colors} padding={16}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{session.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' }}>
                        {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Duración</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginTop: 2 }}>{session.durationMinutes} min</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Volumen</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginTop: 2 }}>{session.totalVolume} {weightUnit}</Text>
                      </View>
                      <Eye size={16} color={colors.textMuted} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Session Detail Modal */}
      <Modal visible={!!expandedSession} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%', borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{expandedSession?.name}</Text>
                {expandedSession && (
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.primaryAccent, textTransform: 'uppercase', marginTop: 2 }}>
                    {new Date(expandedSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setExpandedSession(null)}
                style={{ height: 34, width: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {expandedSession &&
                Object.entries(
                  expandedSession.sets.reduce<Record<string, SetEntry[]>>((acc, set) => {
                    if (!acc[set.exercise.name]) acc[set.exercise.name] = [];
                    acc[set.exercise.name].push(set);
                    return acc;
                  }, {})
                ).map(([exerciseName, sets]) => (
                  <View key={exerciseName} style={{ backgroundColor: colors.surfaceSunken, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.textPrimary }}>{exerciseName}</Text>
                    </View>
                    {sets.map((set, idx) => {
                      const isCardio = set.exercise.muscleGroup.toLowerCase() === 'cardio';
                      const isBodyweight = set.exercise.equipment?.toLowerCase() === 'peso corporal';
                      const details = isCardio ? `${set.reps} min` : isBodyweight ? `${set.reps} reps` : `${set.weight} ${weightUnit} x ${set.reps}`;
                      return (
                        <View
                          key={idx}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            backgroundColor: colors.surface,
                            borderRadius: 12,
                            marginBottom: 6,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>Set {idx + 1}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textPrimary }}>{details}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Modal */}
      <Modal visible={isQrOpen} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 28, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <QrCode size={18} color={colors.primaryAccent} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Acceso QR</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsQrOpen(false)}
                style={{ height: 30, width: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Muestra este código QR en el lector del gimnasio para autorizar tu acceso.
            </Text>

            <View style={{ backgroundColor: colors.surfaceSunken, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 220, width: '100%' }}>
              {isQrLoading || !qrToken ? (
                <ActivityIndicator color={colors.primary} />
              ) : qrTimeLeft <= 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: Palette.red500, marginBottom: 6 }}>Código Expirado</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 12 }}>
                    Por seguridad, el código QR expira en 20 segundos.
                  </Text>
                  <TouchableOpacity
                    onPress={fetchQrToken}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 }}
                  >
                    <RefreshCw size={13} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>Regenerar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ backgroundColor: '#fff', padding: 14, borderRadius: 18 }}>
                  <QRCode value={qrToken} size={Math.min(width * 0.55, 220)} color="#0f172a" backgroundColor="#ffffff" />
                </View>
              )}
            </View>

            {qrToken && qrTimeLeft > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <Clock size={13} color={colors.primaryAccent} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                  Expira en {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Card({ colors, children, style, padding = 18 }: { colors: any; children: React.ReactNode; style?: any; padding?: number }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: 20, padding, borderWidth: 1, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}
