import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Palette } from '../../constants/theme';
import QRCode from 'react-native-qrcode-svg';
import {
  QrCode,
  Flame,
  Trophy,
  Zap,
  Dumbbell,
  Apple,
  Calendar,
  ChevronRight,
  RefreshCw,
  X,
  Maximize2,
  Lock,
  Clock,
  Building2,
  TrendingUp,
  ArrowRight,
  CalendarDays,
  Activity,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/apiClient';

const { width } = Dimensions.get('window');
const QR_LIFETIME_SECONDS = 20;
const GOAL_CALORIES = 2500;

interface WeeklyChartEntry {
  day: string;
  minutos: number;
  count: number;
}

interface RecentSession {
  id: string;
  routineName: string;
  date: string;
  durationMinutes: number;
  volume: number;
  setsCount: number;
}

interface DashboardData {
  streak: number;
  totalSessions: number;
  weeklySessionsCount: number;
  weeklyVolume: number;
  weeklyMinutes: number;
  weeklyChart: WeeklyChartEntry[];
  recentSessions: RecentSession[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, theme } = useAppTheme();
  const { weightUnit } = usePreferences();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [caloriesToday, setCaloriesToday] = useState(0);

  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('INACTIVE');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [serverNow, setServerNow] = useState<string | null>(null);
  const [weeklyStreak, setWeeklyStreak] = useState<number | null>(null);

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(QR_LIFETIME_SECONDS);
  const [isZoomed, setIsZoomed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nowRef = serverNow ? new Date(serverNow) : new Date();
  const isSubscriptionExpired = subscriptionEndDate ? new Date(subscriptionEndDate) < nowRef : false;
  const isSubscriptionInactive = subscriptionStatus !== 'ACTIVE' || isSubscriptionExpired;

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

  async function fetchAll() {
    try {
      const sub = await api.get('/api/user/subscription-status');
      setSubscriptionStatus(sub.subscriptionStatus);
      setSubscriptionEndDate(sub.subscriptionEndDate);
      setServerNow(sub.serverNow);

      const isExpiredNow = sub.subscriptionEndDate ? new Date(sub.subscriptionEndDate) < new Date(sub.serverNow) : false;
      const isInactiveNow = sub.subscriptionStatus !== 'ACTIVE' || isExpiredNow;

      const today = new Date(sub.serverNow).toISOString().split('T')[0];

      try {
        const nutrition = await api.get(`/api/nutrition?date=${today}`);
        setCaloriesToday((nutrition.entries || []).reduce((sum: number, entry: { calories: number }) => sum + entry.calories, 0));
      } catch {}

      try {
        setData(await api.get('/api/dashboard'));
      } catch {}

      try {
        const attendance = await api.get('/api/user/stats/attendance');
        setWeeklyStreak(attendance.streak);
      } catch {}

      if (!isInactiveNow) {
        await fetchQrToken();
      } else {
        setQrToken(null);
      }
    } catch (e) {
      console.error('Error al cargar el dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!qrToken) return;

    timerRef.current = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQrToken();
          return QR_LIFETIME_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrToken]);

  const weekHours = data ? Math.floor(data.weeklyMinutes / 60) : 0;
  const weekMins = data ? (data.weeklyMinutes % 60) : 0;
  const calPct = Math.min(Math.round((caloriesToday / GOAL_CALORIES) * 100), 100);
  const maxMinutesInChart = Math.max(...(data?.weeklyChart?.map((c) => c.minutos) || [0]), 1);
  const streakValue = weeklyStreak !== null ? weeklyStreak : (data?.streak ?? 0);
  const streakLabel = weeklyStreak !== null ? `semana${weeklyStreak !== 1 ? 's' : ''} de racha` : `día${(data?.streak ?? 0) !== 1 ? 's' : ''} de racha`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Hero Header */}
        <View
          style={{
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.primaryAccent, textTransform: 'uppercase', letterSpacing: 1 }}>
            Dashboard
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary, marginTop: 4 }}>
            ¡Hola, <Text style={{ color: colors.primaryAccent }}>{user?.name?.split(' ')[0] || 'Deportista'}</Text>!
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '500' }}>
            Aquí tienes tu resumen de hoy.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {user?.gymName && (
              <Pill icon={<Building2 size={13} color={colors.primaryAccent} />} textColor={colors.primaryAccent} bg={colors.primarySoft}>
                {user.gymName}
              </Pill>
            )}
            {!isSubscriptionInactive ? (
              <Pill icon={<Clock size={13} color={Palette.emerald500} />} textColor={Palette.emerald500} bg={theme === 'dark' ? 'rgba(16,185,129,0.12)' : Palette.emerald50}>
                Cuota activa {subscriptionEndDate ? `hasta ${new Date(subscriptionEndDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
              </Pill>
            ) : (
              <Pill icon={<Clock size={13} color={Palette.rose500} />} textColor={Palette.rose500} bg={theme === 'dark' ? 'rgba(244,63,94,0.12)' : Palette.rose50}>
                Cuota inactiva / expirada
              </Pill>
            )}
          </View>

          {data && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Pill icon={<Flame size={14} color={Palette.orange500} />} textColor={colors.textPrimary} bg={colors.surfaceAlt}>
                <Text style={{ fontWeight: '900', color: colors.textPrimary }}>{streakValue}</Text> {streakLabel}
              </Pill>
              <Pill icon={<Trophy size={14} color={Palette.amber500} />} textColor={colors.textPrimary} bg={colors.surfaceAlt}>
                <Text style={{ fontWeight: '900', color: colors.textPrimary }}>{data.totalSessions}</Text> entrenos totales
              </Pill>
              <Pill icon={<Zap size={14} color={colors.primaryAccent} />} textColor={colors.textPrimary} bg={colors.surfaceAlt}>
                <Text style={{ fontWeight: '900', color: colors.textPrimary }}>{data.weeklySessionsCount}</Text> esta semana
              </Pill>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            {/* QR Access Pass Card */}
            <Card colors={colors} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <IconBadge bg={colors.primarySoft}>
                    <QrCode size={20} color={colors.primaryAccent} />
                  </IconBadge>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Pase de Acceso QR
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: !isSubscriptionInactive && qrToken ? Palette.emerald500 : Palette.red500 }} />
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: !isSubscriptionInactive && qrToken ? Palette.emerald500 : Palette.red500, textTransform: 'uppercase' }}>
                        {!isSubscriptionInactive && qrToken ? 'Activo' : 'Restringido'}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isSubscriptionInactive && qrToken && !isQrLoading && (
                  <TouchableOpacity
                    onPress={fetchQrToken}
                    style={{ height: 32, width: 32, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <RefreshCw size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ backgroundColor: colors.surfaceSunken, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                {isSubscriptionInactive ? (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <IconBadge bg={theme === 'dark' ? 'rgba(244,63,94,0.12)' : Palette.rose50}>
                      <Lock size={20} color={Palette.rose500} />
                    </IconBadge>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10 }}>Acceso Restringido</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 220 }}>
                      Tu cuota ha expirado o está inactiva en el centro. Renuévala para activar tu código QR de acceso.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/profile')}
                      style={{ marginTop: 14, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Pagar Cuota</Text>
                    </TouchableOpacity>
                  </View>
                ) : isQrLoading || !qrToken ? (
                  <View style={{ alignItems: 'center', gap: 8, paddingVertical: 20 }}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>Generando pase...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsZoomed(true)}
                      activeOpacity={0.85}
                      style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 14 }}
                    >
                      <QRCode value={qrToken} size={160} color="#0f172a" backgroundColor="#ffffff" />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                      <Clock size={13} color={colors.primaryAccent} />
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>
                        Expira en {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <Maximize2 size={12} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Toca para ampliar</Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* Weekly Activity Chart */}
            <Card colors={colors} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Actividad Semanal
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginTop: 4 }}>
                    {weekHours > 0 ? `${weekHours}h ` : ''}{weekMins}min
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Volumen</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>
                    {(data?.weeklyVolume ?? 0).toLocaleString()}<Text style={{ fontSize: 11, color: colors.textMuted }}> {weightUnit}</Text>
                  </Text>
                </View>
              </View>

              {data?.weeklyChart && data.weeklyChart.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 }}>
                  {data.weeklyChart.map((item, idx) => {
                    const hasTrained = item.minutos > 0;
                    const barHeightPct = hasTrained ? Math.max((item.minutos / maxMinutesInChart) * 100, 8) : 8;
                    return (
                      <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: hasTrained ? colors.primaryAccent : 'transparent', marginBottom: 4 }}>
                          {hasTrained ? `${item.minutos}m` : ''}
                        </Text>
                        <View
                          style={{
                            width: 20,
                            height: `${barHeightPct}%`,
                            backgroundColor: hasTrained ? colors.primary : colors.surfaceAlt,
                            borderRadius: 6,
                          }}
                        />
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: hasTrained ? colors.textPrimary : colors.textMuted, marginTop: 6 }}>
                          {item.day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                  Sin registros de actividad esta semana
                </Text>
              )}
            </Card>

            {/* Nutrition Card */}
            <Card colors={colors} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <IconBadge bg={theme === 'dark' ? 'rgba(249,115,22,0.12)' : Palette.orange50}>
                  <Apple size={18} color={Palette.orange500} />
                </IconBadge>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Nutrición Hoy
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>
                  {caloriesToday}<Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted }}> kcal</Text>
                </Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textMuted }}>/ {GOAL_CALORIES}</Text>
              </View>
              <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${calPct}%`, borderRadius: 999, backgroundColor: calPct > 100 ? Palette.red500 : Palette.orange500 }} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textAlign: 'right', marginTop: 6 }}>
                {calPct}% del objetivo
              </Text>
            </Card>

            {/* Recent Activity */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Actividad Reciente
              </Text>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primaryAccent }}>Ver todo →</Text>
              </TouchableOpacity>
            </View>

            {data?.recentSessions && data.recentSessions.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 24 }}>
                {data.recentSessions.slice(0, 4).map((session) => (
                  <Card key={session.id} colors={colors} padding={14}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{session.routineName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <Calendar size={11} color={colors.textMuted} />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' }}>
                            {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <StatPill colors={colors} label="DURACIÓN" value={`${session.durationMinutes}m`} icon={<Clock size={11} color={colors.primaryAccent} />} />
                        <StatPill colors={colors} label="VOLUMEN" value={`${session.volume.toLocaleString()}${weightUnit}`} icon={<TrendingUp size={11} color={Palette.emerald500} />} />
                        <ChevronRight size={16} color={colors.textMuted} />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card colors={colors} style={{ marginBottom: 24, alignItems: 'center', paddingVertical: 28 }}>
                <Dumbbell size={28} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10, fontWeight: '600' }}>
                  Aún no hay entrenamientos registrados.
                </Text>
              </Card>
            )}

            {/* Quick Actions */}
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Accesos Rápidos
            </Text>
            <View style={{ gap: 10 }}>
              <QuickAction
                colors={colors}
                onPress={() => router.push('/nutrition')}
                iconBg={theme === 'dark' ? 'rgba(249,115,22,0.12)' : Palette.orange50}
                icon={<Apple size={18} color={Palette.orange500} />}
                title="Registrar Comida"
                subtitle="Diario nutricional"
              />
              <QuickAction
                colors={colors}
                onPress={() => router.push('/workout')}
                iconBg={theme === 'dark' ? 'rgba(16,185,129,0.12)' : Palette.emerald50}
                icon={<Activity size={18} color={Palette.emerald500} />}
                title="Mis Rutinas"
                subtitle="Entrenar ahora"
              />
              <QuickAction
                colors={colors}
                onPress={() => router.push('/classes')}
                iconBg={theme === 'dark' ? 'rgba(124,58,237,0.12)' : Palette.violet50}
                icon={<CalendarDays size={18} color={Palette.violet600} />}
                title="Clases"
                subtitle="Reservar plaza"
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Zoomed QR Modal */}
      <Modal visible={isZoomed} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 28, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <QrCode size={18} color={colors.primaryAccent} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Ampliar Pase QR</Text>
              </View>
              <TouchableOpacity onPress={() => setIsZoomed(false)} style={{ height: 30, width: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Muestra este código QR ampliado en el lector del gimnasio para autorizar tu acceso.
            </Text>
            {qrToken && (
              <View style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 20 }}>
                <QRCode value={qrToken} size={width * 0.55} color="#0f172a" backgroundColor="#ffffff" />
              </View>
            )}
            {qrTimeLeft > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 }}>
                <Clock size={13} color={colors.primaryAccent} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                  Expira en {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: Palette.red500, marginTop: 18 }}>Código Expirado. Cierra para regenerar.</Text>
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

function IconBadge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <View style={{ height: 38, width: 38, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function Pill({ icon, children, textColor, bg }: { icon: React.ReactNode; children: React.ReactNode; textColor: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
      {icon}
      <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor }}>{children}</Text>
    </View>
  );
}

function StatPill({ colors, label, value, icon }: { colors: any; label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 66 }}>
      <Text style={{ fontSize: 7, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
        {icon}
        <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      </View>
    </View>
  );
}

function QuickAction({
  colors,
  onPress,
  iconBg,
  icon,
  title,
  subtitle,
}: {
  colors: any;
  onPress: () => void;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconBadge bg={iconBg}>{icon}</IconBadge>
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>{title}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>{subtitle}</Text>
        </View>
      </View>
      <ArrowRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
