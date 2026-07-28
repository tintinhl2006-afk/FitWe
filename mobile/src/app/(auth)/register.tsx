import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  async function handleRegister() {
    if (!name || !email || !password) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await register({ name, email, password });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Error al completar el registro');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0f172a' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}
        >
          <ArrowLeft size={20} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>Volver</Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>
            Crear Cuenta
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Únete a FitWe y empieza a entrenar con tu plan inteligente.
          </Text>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderWidth: 1,
              borderRadius: 16,
              padding: 14,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <Text style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{error}</Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              Nombre Completo
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <User size={20} color="#64748b" style={{ marginRight: 12 }} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre y Apellidos"
                placeholderTextColor="#64748b"
                style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
              />
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              Correo Electrónico
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <Mail size={20} color="#64748b" style={{ marginRight: 12 }} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
              />
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              Contraseña
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <Lock size={20} color="#64748b" style={{ marginRight: 12 }} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={submitting}
            style={{
              backgroundColor: '#06b6d4',
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginTop: 8,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                  Crear Cuenta
                </Text>
                <ArrowRight size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            ¿Ya tienes una cuenta? <Text style={{ color: '#06b6d4', fontWeight: 'bold' }}>Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
