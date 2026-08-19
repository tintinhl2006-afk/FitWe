import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, CreditCard, Check, ShieldCheck, CheckCircle2, AlertCircle, Receipt, Download } from 'lucide-react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Card, EmptyState } from '../../../components/ui';
import { Palette } from '../../../constants/theme';
import { api, API_BASE_URL, getAuthToken } from '../../../lib/apiClient';
import { downloadAndShareInvoice, type InvoiceClient, type InvoiceGym, type InvoicePayment } from '../../../lib/generateInvoicePdf';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
}

interface PaymentDetails {
  amount: number;
  planName: string;
  cardLast4: string;
  cardBrand: string;
  gymName: string;
  endDate: string;
}

type Step = 'loading' | 'plans' | 'webview' | 'verifying' | 'result' | 'error';

function formatDuration(days: number) {
  if (days === 1) return '1 día';
  if (days === 7) return '1 semana';
  if (days === 30) return '1 mes';
  if (days === 90) return '3 meses';
  if (days === 180) return '6 meses';
  if (days === 365) return '1 año';
  return `${days} días`;
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Extracts the query string from a URL, tolerant of a `#fragment` after it (unlike a plain split('?')[1]). */
function extractQueryString(url: string) {
  const withoutFragment = url.split('#')[0];
  const queryIndex = withoutFragment.indexOf('?');
  return queryIndex === -1 ? '' : withoutFragment.slice(queryIndex + 1);
}

export default function PaymentScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [hasStripe, setHasStripe] = useState(false);
  const [hasRedsys, setHasRedsys] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [gateway, setGateway] = useState<'stripe' | 'redsys'>('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [webviewSource, setWebviewSource] = useState<{ uri: string } | { html: string } | null>(null);
  const [injectedAuthScript, setInjectedAuthScript] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [pendingVerifyUrl, setPendingVerifyUrl] = useState<string | null>(null);
  const handledResultRef = React.useRef(false);

  const [invoices, setInvoices] = useState<InvoicePayment[]>([]);
  const [invoiceClient, setInvoiceClient] = useState<InvoiceClient | null>(null);
  const [invoiceGym, setInvoiceGym] = useState<InvoiceGym | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  async function fetchInvoiceHistory() {
    try {
      const data = await api.get('/api/user/payments');
      setInvoices(data.payments || []);
      setInvoiceClient(data.client || null);
      setInvoiceGym(data.gym || null);
    } catch (e) {
      console.error('Error fetching payment history:', e);
    }
  }

  async function handleDownloadInvoice(payment: InvoicePayment) {
    if (!invoiceClient) return;
    setDownloadingInvoiceId(payment.id);
    try {
      await downloadAndShareInvoice(payment, invoiceClient, invoiceGym);
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar la factura.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  async function fetchPlans() {
    try {
      const data = await api.get('/api/user/plans');
      const planList: Plan[] = data.plans || [];
      setPlans(planList);
      const redsysActive = !!data.hasRedsys;
      const stripeActive = !!data.hasStripe && !redsysActive;
      setHasRedsys(redsysActive);
      setHasStripe(stripeActive);
      setGateway(redsysActive ? 'redsys' : 'stripe');
      setSelectedPlanId(data.currentPlanId || planList[0]?.id || null);
      setStep('plans');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudieron cargar las tarifas de tu gimnasio.');
      setStep('error');
    }
  }

  useEffect(() => {
    fetchPlans();
    fetchInvoiceHistory();
  }, []);

  function buildAuthInjectionScript(token: string) {
    // The web pages this WebView loads (mock checkout pages) call our own authenticated API
    // routes via cookie-based fetch, which the WebView has no session for. Patch fetch so
    // those calls carry the mobile Bearer token instead.
    return `
      (function() {
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
          init = init || {};
          var headers = new Headers(init.headers || {});
          headers.set('Authorization', 'Bearer ${token}');
          init.headers = headers;
          return originalFetch(input, init);
        };
      })();
      true;
    `;
  }

  async function handlePay() {
    if (!selectedPlanId) return;
    setIsSubmitting(true);
    try {
      // Fetch the token and build the injection script here, synchronously before the WebView
      // ever mounts — doing it in a separate effect risked the WebView loading (and the mock
      // page's checkout fetch firing) before the async token lookup resolved.
      const token = await getAuthToken();
      setInjectedAuthScript(token ? buildAuthInjectionScript(token) : '');

      const data = await api.post('/api/user/payment', { planId: selectedPlanId, gateway });

      if (data.isRedsysForm) {
        const inputs = Object.entries(data.params as Record<string, string>)
          .map(([key, value]) => `<input type="hidden" name="${escapeHtmlAttr(key)}" value="${escapeHtmlAttr(value)}" />`)
          .join('');
        const html = `<html><body onload="document.forms[0].submit()"><form method="POST" action="${escapeHtmlAttr(data.url)}">${inputs}</form></body></html>`;
        setWebviewSource({ html });
      } else if (data.url) {
        const uri = data.url.startsWith('http') ? data.url : `${API_BASE_URL}${data.url}`;
        setWebviewSource({ uri });
      } else {
        throw new Error('No se recibió la URL de pago del servidor.');
      }
      handledResultRef.current = false;
      setStep('webview');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(url: string) {
    if (handledResultRef.current) return;
    handledResultRef.current = true;
    setPendingVerifyUrl(url);
    setStep('verifying');
    try {
      const query = extractQueryString(url);
      const data = await api.get(`/api/user/payment/verify?${query}`);
      setPaymentDetails(data.payment);
      await refreshUser();
      setPendingVerifyUrl(null);
      setStep('result');
    } catch (e) {
      // The gateway may have already charged the card even if this verification call failed
      // (e.g. a transient network drop right after payment) — keep the URL so "Reintentar
      // Verificación" re-checks the SAME transaction instead of sending the user back to pay
      // again, which would risk a double charge.
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo verificar el pago.');
      setStep('error');
    }
  }

  function retryVerification() {
    if (!pendingVerifyUrl) {
      fetchPlans();
      return;
    }
    handledResultRef.current = false;
    handleVerify(pendingVerifyUrl);
  }

  function handleNavigationChange(navState: WebViewNavigation) {
    const url = navState.url;
    if (url.includes('/dashboard/pago/success')) {
      handleVerify(url);
      return;
    }
    const isCancelUrl = url.includes('/dashboard/pago') && !url.includes('/dashboard/pago/redsys-mock') && !url.includes('/dashboard/pago/stripe-mock');
    if (isCancelUrl && !handledResultRef.current) {
      handledResultRef.current = true;
      setStep('plans');
    }
  }

  if (step === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (step === 'webview' && webviewSource) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => setStep('plans')} style={{ padding: 6 }}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <ShieldCheck size={16} color={Palette.emerald500} />
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary }}>Pasarela de pago segura</Text>
        </View>
        <WebView
          source={webviewSource as any}
          onNavigationStateChange={handleNavigationChange}
          injectedJavaScriptBeforeContentLoaded={injectedAuthScript}
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ height: 36, width: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Mi Suscripción y Cuotas</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}>
        {step === 'verifying' && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center' }}>Verificando pago seguro...</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 }}>
              Estamos confirmando la transacción y actualizando tu cuota.
            </Text>
          </View>
        )}

        {step === 'error' && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
            <AlertCircle size={36} color={Palette.red500} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center' }}>{errorMsg}</Text>
            {pendingVerifyUrl && (
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 16 }}>
                Si la pasarela ya te cobró, no vuelvas a pagar: pulsa "Reintentar Verificación" para confirmar ese mismo cobro.
              </Text>
            )}
            <TouchableOpacity onPress={retryVerification} style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{pendingVerifyUrl ? 'Reintentar Verificación' : 'Reintentar'}</Text>
            </TouchableOpacity>
            {pendingVerifyUrl && (
              <TouchableOpacity
                onPress={() => {
                  setPendingVerifyUrl(null);
                  fetchPlans();
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' }}>Volver a la selección de tarifas</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 'result' && paymentDetails && (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={32} color={Palette.emerald500} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' }}>¡Pago Confirmado!</Text>
            <Card style={{ width: '100%', gap: 10 }}>
              <SummaryRow label="Plan" value={paymentDetails.planName} colors={colors} />
              <SummaryRow label="Importe" value={`${Number(paymentDetails.amount).toFixed(2)} €`} colors={colors} />
              <SummaryRow label="Tarjeta" value={`${paymentDetails.cardBrand} •••• ${paymentDetails.cardLast4}`} colors={colors} />
              <SummaryRow label="Gimnasio" value={paymentDetails.gymName} colors={colors} />
              <SummaryRow label="Cuota activa hasta" value={new Date(paymentDetails.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} colors={colors} />
            </Card>
            <TouchableOpacity onPress={() => router.replace('/')} style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Volver al Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'plans' && (
          <>
            {plans.length === 0 ? (
              <EmptyState icon={<CreditCard size={28} color={colors.textMuted} />} title="Sin tarifas disponibles" subtitle="Tu gimnasio no tiene tarifas activas configuradas." />
            ) : (
              <>
                <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Elige tu Tarifa</Text>
                <View style={{ gap: 10, marginBottom: 20 }}>
                  {plans.map((plan) => {
                    const selected = selectedPlanId === plan.id;
                    return (
                      <TouchableOpacity key={plan.id} onPress={() => setSelectedPlanId(plan.id)}>
                        <Card style={{ borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface }} padding={14}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{plan.name}</Text>
                              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{formatDuration(plan.durationDays)}</Text>
                              {plan.description && (
                                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                                  {plan.description}
                                </Text>
                              )}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>{plan.price.toFixed(2)}€</Text>
                              {selected && <Check size={16} color={colors.primaryAccent} style={{ marginTop: 4 }} />}
                            </View>
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {hasStripe && hasRedsys && (
                  <>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Método de Pago</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                      {(['stripe', 'redsys'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGateway(g)}
                          style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: gateway === g ? colors.primary : colors.border, backgroundColor: gateway === g ? colors.primarySoft : colors.surface }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: gateway === g ? colors.primaryAccent : colors.textPrimary }}>{g === 'stripe' ? 'Tarjeta (Stripe)' : 'TPV Redsys'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <ShieldCheck size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}>Pago procesado de forma segura y cifrada por tu centro deportivo.</Text>
                </View>

                <TouchableOpacity
                  onPress={handlePay}
                  disabled={isSubmitting || !selectedPlanId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    opacity: isSubmitting || !selectedPlanId ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <CreditCard size={16} color="#fff" />}
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Pagar Ahora</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ marginTop: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Receipt size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>
                  Historial de Facturas
                </Text>
              </View>

              {invoices.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>No se han registrado pagos todavía.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {invoices.map((inv) => (
                    <Card key={inv.id} padding={14}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textPrimary }}>{inv.description}</Text>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                            {new Date(inv.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {'  ·  '}
                            {inv.invoiceNumber || `F-${inv.id.slice(0, 8).toUpperCase()}`}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{inv.amount.toFixed(2)} €</Text>
                          <TouchableOpacity
                            onPress={() => handleDownloadInvoice(inv)}
                            disabled={downloadingInvoiceId === inv.id}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            {downloadingInvoiceId === inv.id ? (
                              <ActivityIndicator size="small" color={colors.primaryAccent} />
                            ) : (
                              <Download size={12} color={colors.primaryAccent} />
                            )}
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.primaryAccent }}>Factura</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
