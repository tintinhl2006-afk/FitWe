import React, { useState, useEffect } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import {
  Sparkles,
  QrCode,
  Flame,
  Dumbbell,
  Calendar,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  TrendingUp,
  Clock,
  Building2,
  Utensils,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/apiClient';

const { width } = Dimensions.get('window');

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
  routinesCount: number;
  weeklySessionsCount: number;
  weeklyVolume: number;
  weeklyMinutes: number;
  weeklyChart: WeeklyChartEntry[];
  streak: number;
  totalSessions: number;
  recentSessions: RecentSession[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [caloriesToday, setCaloriesToday] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    generateDynamicQR();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateDynamicQR();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      const res = await api.get('/api/dashboard');
      if (res) {
        setDashData(res);
      }
    } catch (e) {
      console.error('Error al cargar datos reales del dashboard:', e);
      setDashData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function generateDynamicQR() {
    if (!user) return;
    const timestamp = Date.now();
    const payload = JSON.stringify({
      userId: user.id,
      gymId: user.gymId || 'default-gym',
      timestamp,
      signature: `sig_${user.id.slice(0, 6)}_${timestamp}`,
    });
    setQrToken(payload);
  }

  const maxMinutesInChart = Math.max(
    ...(dashData?.weeklyChart?.map((c) => c.minutos) || [60]),
    60
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Hero Header */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: 1 }}>
                Dashboard
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffffff', marginTop: 2 }}>
                ¡Hola, <Text style={{ color: '#06b6d4' }}>{user?.name?.split(' ')[0] || 'Deportista'}</Text>!
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building2 size={14} color="#06b6d4" />
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06b6d4' }}>
                {user?.gymName || 'FitWe Gym'}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Access Pass Card */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: '#334155',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ padding: 10, backgroundColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 14 }}>
                <QrCode size={22} color="#06b6d4" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>Pase de Torno Digital</Text>
                <Text style={{ fontSize: 11, color: user?.subscriptionStatus === 'ACTIVE' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                  {user?.subscriptionStatus === 'ACTIVE' ? '✓ Cuota Activa' : 'Pase de Acceso'}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw size={12} color="#94a3b8" />
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 'bold' }}>{timeLeft}s</Text>
            </View>
          </View>

          {/* QR Display */}
          <TouchableOpacity
            onPress={() => setShowQrModal(true)}
            activeOpacity={0.88}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginVertical: 4,
            }}
          >
            {qrToken ? (
              <QRCode value={qrToken} size={160} color="#0f172a" backgroundColor="#ffffff" />
            ) : (
              <ActivityIndicator color="#06b6d4" />
            )}
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
            Toca el código para ampliar al tamaño completo del lector
          </Text>
        </View>

        {/* Streak & Weekly Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* Streak Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Flame size={18} color="#f59e0b" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#f59e0b' }}>Racha Actual</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffffff' }}>
                {dashData?.streak ?? 0}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8' }}>días seguidos</Text>
            </View>
          </View>

          {/* Volume Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={18} color="#a855f7" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#a855f7' }}>Volumen Semanal</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#ffffff' }}>
                {(dashData?.weeklyVolume ?? 0).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8' }}>kg</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Bar Chart */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: '#334155',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Actividad Semanal</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                {dashData?.weeklyMinutes ?? 0} minutos entrenados esta semana
              </Text>
            </View>

            <View style={{ padding: 8, borderRadius: 12, backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
              <Clock size={18} color="#06b6d4" />
            </View>
          </View>

          {/* Custom Native Bar Chart */}
          {dashData?.weeklyChart && dashData.weeklyChart.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, paddingTop: 10 }}>
              {dashData.weeklyChart.map((item, idx) => {
                const barHeightPct = item.minutos > 0 ? (item.minutos / maxMinutesInChart) * 100 : 8;
                const hasTrained = item.minutos > 0;
                return (
                  <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: hasTrained ? '#06b6d4' : 'transparent', marginBottom: 4 }}>
                      {item.minutos > 0 ? `${item.minutos}m` : ''}
                    </Text>
                    <View
                      style={{
                        width: 22,
                        height: `${barHeightPct}%`,
                        backgroundColor: hasTrained ? '#06b6d4' : '#334155',
                        borderRadius: 6,
                      }}
                    />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: hasTrained ? '#ffffff' : '#64748b', marginTop: 6 }}>
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>Sin registros de actividad esta semana</Text>
            </View>
          )}
        </View>

        {/* Recent Workout Sessions */}
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 }}>
          Últimos Entrenamientos Registrados
        </Text>

        {dashData?.recentSessions && dashData.recentSessions.length > 0 ? (
          <View style={{ gap: 12, marginBottom: 24 }}>
            {dashData.recentSessions.map((session) => (
              <View
                key={session.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#334155',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                    <Dumbbell size={20} color="#a855f7" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>{session.routineName}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {session.date} • {session.durationMinutes} min
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#a855f7' }}>
                    {session.volume.toLocaleString()} kg
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{session.setsCount} series</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#334155',
              marginBottom: 24,
            }}
          >
            <Dumbbell size={32} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
              No has registrado ninguna sesión aún
            </Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 2, marginBottom: 12 }}>
              Comienza un entrenamiento para ver aquí tu volumen e historial.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/workout')}
              style={{
                backgroundColor: '#a855f7',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Iniciar Entreno</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fullscreen QR Modal */}
      <Modal visible={showQrModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowQrModal(false)}
            style={{ position: 'absolute', top: 50, right: 24, padding: 8 }}
          >
            <X size={28} color="#ffffff" />
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 6, textAlign: 'center' }}>
            Pase de Torno Digital
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32, textAlign: 'center' }}>
            Acerca la pantalla al lector óptico del torno del gimnasio
          </Text>

          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrToken ? (
              <QRCode value={qrToken} size={width * 0.7} color="#0f172a" backgroundColor="#ffffff" />
            ) : null}
          </View>

          <Text style={{ fontSize: 12, color: '#10b981', marginTop: 24, fontWeight: 'bold' }}>
            ✓ Código seguro que rota cada {timeLeft}s
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
