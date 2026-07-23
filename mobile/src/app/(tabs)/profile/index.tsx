import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import {
  User,
  ShieldCheck,
  CreditCard,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  Sparkles,
  QrCode,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header Profile Card */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: '#334155',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              borderWidth: 2,
              borderColor: '#06b6d4',
            }}
          >
            <User size={36} color="#06b6d4" />
          </View>

          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>
            {user?.name || 'Deportista'}
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user?.email}</Text>

          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.3)',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#a855f7' }}>
              Rol: {user?.role === 'ADMIN' ? 'Administrador de Gimnasio' : 'Socio FitWe'}
            </Text>
          </View>
        </View>

        {/* Subscription Info Card */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
            Suscripción & Gimnasio
          </Text>

          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#334155',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <CreditCard size={20} color="#10b981" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>
                  {user?.gymName || 'Gimnasio FitWe'}
                </Text>
                <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
                  Estado: {user?.subscriptionStatus || 'ACTIVO'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Shortcut (If Admin) */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
              Administración
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/admin/qr-scanner')}
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(6, 182, 212, 0.3)',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <QrCode size={20} color="#06b6d4" />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>Escáner de Torno (Recepción)</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>Validar accesos manualmente</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#06b6d4" />
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Options */}
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
          Ajustes de la Aplicación
        </Text>

        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#334155',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#334155',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Bell size={20} color="#94a3b8" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '500' }}>Notificaciones Push</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Lock size={20} color="#94a3b8" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '500' }}>Cambiar Contraseña</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 18,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: 'bold' }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
