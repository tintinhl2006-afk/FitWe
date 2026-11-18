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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GlassView } from '../../components/ui/Glass';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  async function handleLogin() {
    if (!email || !password) {
      setError('Por favor, introduce tu email y contraseña.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'transparent' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Image
            source={require('../../../assets/images/fitwe-icon.png')}
            resizeMode="contain"
            style={{ width: 88, height: 88, marginBottom: 16 }}
          />
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
            FitWe
          </Text>
          <Text style={{ fontSize: 14, color: '#cbd5e1', textAlign: 'center', marginTop: 4 }}>
            Tu plataforma inteligente de fitness y gimnasio
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

        <GlassView radius={28} style={{ padding: 22, gap: 16 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              Correo Electrónico
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.18)',
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
                placeholder="socio@ejemplo.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
              />
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              Contraseña
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.18)',
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
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: 10 }}
            >
              <Text style={{ color: '#06b6d4', fontSize: 13, fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={submitting}
            style={{
              backgroundColor: '#0e7490',
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginTop: 8,
              shadowColor: '#06b6d4',
              shadowOpacity: 0.55,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                  Iniciar Sesión
                </Text>
                <ArrowRight size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </GlassView>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: '#cbd5e1', fontSize: 14 }}>
            ¿No tienes cuenta? <Text style={{ color: '#06b6d4', fontWeight: 'bold' }}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
