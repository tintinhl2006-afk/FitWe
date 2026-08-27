import React, { useState } from 'react';
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
import { api } from '../../lib/apiClient';
import { Mail, AlertCircle, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit() {
    if (!email) {
      setError('Por favor, introduce tu email.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el restablecimiento de contraseña');
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
            Recuperar Contraseña
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Te enviaremos un enlace a tu email para restablecer tu contraseña.
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

        {successMessage ? (
          <View
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              borderWidth: 1,
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
            }}
          >
            <MailCheck size={28} color="#06b6d4" style={{ marginBottom: 10 }} />
            <Text style={{ color: '#e2e8f0', fontSize: 14, textAlign: 'center' }}>
              {successMessage}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              El enlace se abrirá en tu navegador para completar el restablecimiento.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
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
                  placeholder="socio@ejemplo.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, color: '#ffffff', fontSize: 15 }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
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
                    Enviar Enlace
                  </Text>
                  <ArrowRight size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
