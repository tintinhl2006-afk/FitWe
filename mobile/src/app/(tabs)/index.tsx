import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
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

  function generateDynamicQR() {
    if (!user) return;
    const timestamp = Date.now();
    // Dynamic token combining member ID + timestamp
    const payload = JSON.stringify({
      userId: user.id,
      gymId: user.gymId || 'default-gym',
      timestamp,
      signature: `sig_${user.id.slice(0, 6)}_${timestamp}`,
    });
    setQrToken(payload);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>Bienvenido de nuevo</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginTop: 2 }}>
              {user?.name || 'Deportista'}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(6, 182, 212, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldCheck size={14} color="#06b6d4" />
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06b6d4' }}>
              {user?.subscriptionStatus === 'ACTIVE' ? 'Socio Activo' : 'Pase Libre'}
            </Text>
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ padding: 8, backgroundColor: 'rgba(6, 182, 212, 0.2)', borderRadius: 12 }}>
                <QrCode size={20} color="#06b6d4" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>Pase de Torno</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                  {user?.gymName || 'Gimnasio FitWe'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={12} color="#64748b" />
              <Text style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold' }}>{timeLeft}s</Text>
            </View>
          </View>

          {/* QR Container */}
          <TouchableOpacity
            onPress={() => setShowQrModal(true)}
            activeOpacity={0.9}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginVertical: 8,
            }}
          >
            {qrToken ? (
              <QRCode value={qrToken} size={150} color="#0f172a" backgroundColor="#ffffff" />
            ) : null}
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
            Toca el código para ampliar y acercar al lector del torno
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 }}>
          Resumen Diario
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Flame size={18} color="#f59e0b" />
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>Calorías</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>2,450</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Objetivo diario</Text>
          </View>

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Dumbbell size={18} color="#06b6d4" />
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>Entrenos</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>4 / 5</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Esta semana</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 }}>
          Acciones Rápidas
        </Text>

        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/nutrition')}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
                <Sparkles size={20} color="#06b6d4" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Planificador de Dieta IA</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Genera tu menú ajustado a tus macros</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/workout')}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                <Dumbbell size={20} color="#a855f7" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Generar Rutina Científica</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Ajuste óptimo de series semanales</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/classes')}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <Calendar size={20} color="#10b981" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Reservar Clases</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Consulta horarios y disponibilidad</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fullscreen QR Modal */}
      <Modal visible={showQrModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
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

          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, textAlign: 'center' }}>
            Escanea en el Torno
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32, textAlign: 'center' }}>
            Acerca la pantalla del teléfono al lector infrarrojo del gimnasio
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

          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24, fontWeight: 'bold' }}>
            Actualizado automáticamente ({timeLeft}s)
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
