import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react-native';
import { api } from '../../lib/apiClient';

export default function AdminQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ allowed: boolean; text: string } | null>(null);

  const router = useRouter();

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#0f172a' }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
          Permiso de Cámara Requerido
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
          {permission.canAskAgain
            ? 'Necesitamos acceso a la cámara para escanear los pases QR de los socios.'
            : 'Has denegado el acceso a la cámara permanentemente. Actívalo desde los ajustes del sistema para poder escanear pases QR.'}
        </Text>
        <TouchableOpacity
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          style={{ backgroundColor: '#06b6d4', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{permission.canAskAgain ? 'Conceder Permiso' : 'Abrir Ajustes'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    try {
      // Decode QR token JSON payload
      const payload = JSON.parse(data);
      if (typeof payload?.userId !== 'string' || !payload.userId) {
        throw new Error('Payload QR con forma inválida');
      }
      const res = await api.post('/api/access/verify', {
        token: data,
        memberId: payload.userId,
      });

      if (res.allowed) {
        setResultMessage({ allowed: true, text: `ACCESO PERMITIDO - ${res.memberName || 'Socio'}` });
      } else {
        setResultMessage({ allowed: false, text: `ACCESO DENEGADO - ${res.reason || 'Cuota inactiva'}` });
      }
    } catch (error) {
      setResultMessage({ allowed: false, text: 'ACCESO DENEGADO - Código QR inválido' });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>Escáner de Recepción</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Overlay frame */}
        <View
          style={{
            width: 250,
            height: 250,
            borderWidth: 3,
            borderColor: resultMessage ? (resultMessage.allowed ? '#10b981' : '#ef4444') : '#06b6d4',
            borderRadius: 24,
            backgroundColor: 'transparent',
          }}
        />

        {resultMessage && (
          <View
            style={{
              position: 'absolute',
              bottom: 80,
              left: 20,
              right: 20,
              backgroundColor: resultMessage.allowed ? '#064e3b' : '#7f1d1d',
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            {resultMessage.allowed ? <CheckCircle2 size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15, flex: 1 }}>{resultMessage.text}</Text>
          </View>
        )}

        {scanned && (
          <TouchableOpacity
            onPress={() => {
              setScanned(false);
              setResultMessage(null);
            }}
            style={{
              position: 'absolute',
              bottom: 24,
              backgroundColor: '#06b6d4',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={18} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Escanear Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
