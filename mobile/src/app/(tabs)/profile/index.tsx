import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
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
  Settings,
  Scale,
  Ruler,
  Download,
  X,
  Check,
  Globe,
} from 'lucide-react-native';
import { api } from '../../../lib/apiClient';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Modals State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Profile Form
  const [weight, setWeight] = useState('82.5');
  const [height, setHeight] = useState('178');
  const [bio, setBio] = useState('');

  // Units State
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleUpdateProfile() {
    setIsSubmitting(true);
    try {
      await api.put('/api/settings/profile', {
        weight: Number(weight),
        height: Number(height),
        bio,
      });

      Alert.alert('Perfil Actualizado', 'Tus datos antropométricos se han guardado con éxito.');
      setShowEditProfileModal(false);
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron guardar las modificaciones.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Campos requeridos', 'Introduce tu contraseña actual y la nueva.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put('/api/settings/password', {
        currentPassword,
        newPassword,
      });

      Alert.alert('Contraseña Cambiada', 'Tu contraseña se ha actualizado correctamente.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'La contraseña actual no es correcta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportData() {
    try {
      Alert.alert('Exportar Datos', 'Se ha solicitado la exportación de tus datos de entrenamiento y nutrición.');
    } catch (error) {
      console.error(error);
    }
  }

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
        {/* Profile Card Header */}
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: '#334155',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              borderWidth: 2,
              borderColor: '#06b6d4',
            }}
          >
            <User size={40} color="#06b6d4" />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}>
            {user?.name || 'Martin Herrero'}
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user?.email}</Text>

          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(6, 182, 212, 0.3)',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#06b6d4' }}>
              Socio • {user?.gymName || 'Iron Temple Fitness'}
            </Text>
          </View>
        </View>

        {/* Subscription Info Card */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
            Suscripción & Centro
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
                  {user?.gymName || 'Iron Temple Fitness'}
                </Text>
                <Text style={{ fontSize: 12, color: user?.subscriptionStatus === 'ACTIVE' ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                  {user?.subscriptionStatus === 'ACTIVE' ? '✓ Cuota Activa' : '✕ Cuota Inactiva / Vencida'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Subpages Menu */}
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
          Configuración de la Cuenta
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
          {/* Edit Profile */}
          <TouchableOpacity
            onPress={() => setShowEditProfileModal(true)}
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
              <Scale size={20} color="#06b6d4" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '600' }}>Perfil Antropométrico (Peso/Altura)</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Unit Preferences */}
          <TouchableOpacity
            onPress={() => setShowUnitsModal(true)}
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
              <Ruler size={20} color="#a855f7" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '600' }}>Unidades de Medida ({weightUnit} / {distanceUnit})</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Password & Security */}
          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
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
              <Lock size={20} color="#f59e0b" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '600' }}>Cambiar Contraseña</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Data Export */}
          <TouchableOpacity
            onPress={handleExportData}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Download size={20} color="#10b981" />
              <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '600' }}>Exportar Mis Datos (CSV)</Text>
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
          <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: 'bold' }}>Cerrar Sesión Segura</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfileModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>Editar Perfil Antropométrico</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)} style={{ padding: 6 }}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Peso Corporal ({weightUnit})
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 16 }}
              />

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Altura (cm)
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 20 }}
              />

              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={isSubmitting}
                style={{ backgroundColor: '#06b6d4', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Guardar Cambios</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={{ padding: 6 }}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Contraseña Actual
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 14 }}
              />

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Nueva Contraseña
              </Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 14 }}
              />

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Confirmar Nueva Contraseña
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 20 }}
              />

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isSubmitting}
                style={{ backgroundColor: '#06b6d4', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Actualizar Contraseña</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Units Preferences Modal */}
      <Modal visible={showUnitsModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.98)', padding: 20 }}>
          <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>Unidades de Medida</Text>
              <TouchableOpacity onPress={() => setShowUnitsModal(false)} style={{ padding: 6 }}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
              Unidad de Peso
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setWeightUnit('kg')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: weightUnit === 'kg' ? '#06b6d4' : '#334155',
                  backgroundColor: weightUnit === 'kg' ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: weightUnit === 'kg' ? '#06b6d4' : '#ffffff' }}>
                  Kilogramos (kg)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setWeightUnit('lbs')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: weightUnit === 'lbs' ? '#06b6d4' : '#334155',
                  backgroundColor: weightUnit === 'lbs' ? 'rgba(6, 182, 212, 0.2)' : '#0f172a',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: weightUnit === 'lbs' ? '#06b6d4' : '#ffffff' }}>
                  Libras (lbs)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowUnitsModal(false)}
              style={{ backgroundColor: '#06b6d4', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
