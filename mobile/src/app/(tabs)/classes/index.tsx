import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Calendar,
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Palette } from '../../../constants/theme';
import { api } from '../../../lib/apiClient';

interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  capacity: number;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  isOpen: boolean;
  isFull: boolean;
  opensAt: string | null;
  userBookingId: string | null;
  isBooked: boolean;
}

function timeUntil(dateStr: string, now: Date): string {
  const diff = new Date(dateStr).getTime() - now.getTime();
  if (diff <= 0) return 'Ahora';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ClassesScreen() {
  const { colors } = useAppTheme();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [noGym, setNoGym] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  const daysScrollRef = useRef<ScrollView>(null);
  const daysScrollXRef = useRef(0);
  const [canScrollDaysLeft, setCanScrollDaysLeft] = useState(false);
  const DAYS_SCROLL_STEP = 220;

  function handleDaysScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    daysScrollXRef.current = x;
    setCanScrollDaysLeft(x > 5);
  }

  function scrollDays(direction: 1 | -1) {
    const nextX = Math.max(0, daysScrollXRef.current + direction * DAYS_SCROLL_STEP);
    daysScrollRef.current?.scrollTo({ x: nextX, animated: true });
  }

  // Re-check on every focus (not just mount) so renewing the subscription on the
  // payment screen and returning here reflects the new status immediately.
  useFocusEffect(
    useCallback(() => {
      api
        .get('/api/user/subscription-status')
        .then((sub) => {
          const expired = sub.subscriptionEndDate ? new Date(sub.subscriptionEndDate) < new Date(sub.serverNow) : false;
          setIsSubscriptionActive(sub.subscriptionStatus === 'ACTIVE' && !expired);
        })
        .catch(() => setIsSubscriptionActive(false));
    }, [])
  );

  async function fetchClasses(date: string) {
    setIsLoading(true);
    setNoGym(false);
    try {
      const res = await api.get(`/api/classes?date=${date}`);
      setClasses(Array.isArray(res) ? res : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('gimnasio')) setNoGym(true);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleBook(classId: string) {
    if (!isSubscriptionActive) return;
    setActionId(classId);
    try {
      await api.post('/api/classes', { classId });
      setToast({ msg: '¡Reserva confirmada!', type: 'ok' });
      fetchClasses(selectedDate);
    } catch (e: any) {
      setToast({ msg: e.message || 'Error al reservar', type: 'err' });
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!isSubscriptionActive) return;
    setActionId(bookingId);
    try {
      await api.delete(`/api/classes?bookingId=${bookingId}`);
      setToast({ msg: 'Reserva cancelada', type: 'ok' });
      fetchClasses(selectedDate);
    } catch (e: any) {
      setToast({ msg: e.message || 'Error de conexión', type: 'err' });
    } finally {
      setActionId(null);
    }
  }

  const grouped = classes.reduce<Record<string, ClassItem[]>>((acc, c) => {
    const dateKey = capitalize(new Date(c.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Calendar size={22} color={colors.primaryAccent} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>Clases del Gimnasio</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 18 }}>
          Reserva tu plaza con hasta 48 horas de antelación.
        </Text>

        {!isSubscriptionActive && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              borderRadius: 16,
              marginBottom: 18,
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <Lock size={18} color={Palette.red500} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
              Tu cuota ha caducado. Renuévala para poder reservar clases.
            </Text>
          </View>
        )}

        {/* Toast */}
        {toast && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              borderRadius: 16,
              marginBottom: 14,
              backgroundColor: toast.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              borderWidth: 1,
              borderColor: toast.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            }}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={16} color={Palette.emerald500} /> : <AlertCircle size={16} color={Palette.red500} />}
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: toast.type === 'ok' ? Palette.emerald500 : Palette.red500 }}>
              {toast.msg}
            </Text>
            <TouchableOpacity onPress={() => setToast(null)}>
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Rolling day selector */}
        {!noGym && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <CalendarDays size={14} color={colors.primaryAccent} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Selecciona una fecha
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {canScrollDaysLeft && (
                <TouchableOpacity
                  onPress={() => scrollDays(-1)}
                  style={{ height: 32, width: 32, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              )}
              <ScrollView
                ref={daysScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleDaysScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
              >
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = new Date(now);
                  d.setDate(d.getDate() + i);
                  const dateStr = d.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const dayName = capitalize(d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''));
                  const monthName = capitalize(d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));

                  return (
                    <TouchableOpacity
                      key={dateStr}
                      onPress={() => setSelectedDate(dateStr)}
                      style={{
                        minWidth: 62,
                        paddingVertical: 12,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '900', color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted, textTransform: 'uppercase' }}>
                        {dayName}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: isSelected ? '#fff' : colors.textPrimary, marginTop: 2 }}>{d.getDate()}</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted, marginTop: 2 }}>
                        {monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              </ScrollView>
              <TouchableOpacity
                onPress={() => scrollDays(1)}
                style={{ height: 32, width: 32, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : noGym ? (
          <EmptyState
            colors={colors}
            title="Sin gimnasio asignado"
            subtitle="Tu cuenta no está vinculada a ningún gimnasio. Contacta con tu centro deportivo."
          />
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState colors={colors} title="No hay clases para este día" subtitle="No hay ninguna actividad programada para la fecha seleccionada." />
        ) : (
          <View style={{ gap: 24 }}>
            {Object.entries(grouped).map(([date, items]) => (
              <View key={date}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  {date}
                </Text>
                <View style={{ gap: 12 }}>
                  {items.map((c) => {
                    const timeStart = new Date(c.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const timeEnd = new Date(c.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const accentColor = c.isBooked ? colors.primary : !c.isOpen ? colors.textMuted : c.isFull ? Palette.red500 : Palette.violet600;

                    return (
                      <View
                        key={c.id}
                        style={{
                          borderRadius: 20,
                          padding: 16,
                          paddingLeft: 18,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: c.isBooked ? colors.primary : colors.border,
                          overflow: 'hidden',
                        }}
                      >
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: accentColor }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, flexShrink: 1 }}>{c.name}</Text>
                          {c.isBooked && (
                            <View style={{ backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9, fontWeight: '900', color: colors.primaryAccent, textTransform: 'uppercase' }}>Reservada</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                          <MetaPill colors={colors} icon={<Clock size={12} color={colors.primaryAccent} />} text={`${timeStart} - ${timeEnd}`} />
                          <MetaPill colors={colors} icon={<UserIcon size={12} color={Palette.violet600} />} text={c.instructor} />
                          <MetaPill colors={colors} icon={<Users size={12} color={Palette.emerald500} />} text={`${c.spotsLeft} plaza${c.spotsLeft !== 1 ? 's' : ''} libre${c.spotsLeft !== 1 ? 's' : ''}`} />
                        </View>

                        <View style={{ marginTop: 14 }}>
                          {c.isBooked ? (
                            <TouchableOpacity
                              onPress={() => handleCancel(c.userBookingId!)}
                              disabled={actionId === c.userBookingId || !isSubscriptionActive}
                              style={{
                                alignSelf: 'flex-start',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 16,
                                paddingVertical: 9,
                                borderRadius: 999,
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                borderWidth: 1,
                                borderColor: 'rgba(239,68,68,0.3)',
                                opacity: actionId === c.userBookingId ? 0.6 : 1,
                              }}
                            >
                              {actionId === c.userBookingId ? <ActivityIndicator size="small" color={Palette.red500} /> : <X size={13} color={Palette.red500} />}
                              <Text style={{ fontSize: 11, fontWeight: '900', color: Palette.red500, textTransform: 'uppercase' }}>Cancelar</Text>
                            </TouchableOpacity>
                          ) : !c.isOpen ? (
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 16,
                                paddingVertical: 9,
                                borderRadius: 999,
                                backgroundColor: colors.surfaceAlt,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            >
                              <Lock size={12} color={colors.textMuted} />
                              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>
                                Abre en {timeUntil(c.opensAt!, now)}
                              </Text>
                            </View>
                          ) : c.isFull ? (
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                paddingHorizontal: 16,
                                paddingVertical: 9,
                                borderRadius: 999,
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                borderWidth: 1,
                                borderColor: 'rgba(239,68,68,0.25)',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '900', color: Palette.red500, textTransform: 'uppercase' }}>Completa</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleBook(c.id)}
                              disabled={actionId === c.id || !isSubscriptionActive}
                              style={{
                                alignSelf: 'flex-start',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 18,
                                paddingVertical: 10,
                                borderRadius: 999,
                                backgroundColor: colors.primary,
                                opacity: actionId === c.id ? 0.6 : 1,
                              }}
                            >
                              {actionId === c.id ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle2 size={13} color="#fff" />}
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Reservar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ colors, icon, text }: { colors: any; icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{text}</Text>
    </View>
  );
}

function EmptyState({ colors, title, subtitle }: { colors: any; title: string; subtitle: string }) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.border,
      }}
    >
      <Calendar size={36} color={colors.textMuted} style={{ marginBottom: 14 }} />
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>{subtitle}</Text>
    </View>
  );
}
