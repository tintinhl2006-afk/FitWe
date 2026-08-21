"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowLeft,
  Shield,
  Clock,
  Tag,
  Check,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
}

export default function PaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "redsys" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const gymName = session?.user?.gymName || "Tu Gimnasio";

  // Fetch available plans from user's gym
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/user/plans?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans);
          setPaymentGateway(data.paymentGateway || null);

          // Auto-select current plan or first plan
          if (data.currentPlanId) {
            setSelectedPlanId(data.currentPlanId);
          } else if (data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || errorData.error || `Error al cargar tarifas (código ${res.status})`);
        }
      } catch (e: any) {
        console.error("Error fetching plans:", e);
        setError("Error de conexión al cargar las tarifas oficiales.");
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const displayPrice = selectedPlan?.price ?? 0;
  const displayPlanName = selectedPlan?.name ?? "Ninguno seleccionado";
  const displayDuration = selectedPlan ? selectedPlan.durationDays : 0;

  const formatDuration = (days: number) => {
    if (days === 1) return "1 día";
    if (days === 7) return "1 semana";
    if (days === 14) return "2 semanas";
    if (days === 30) return "1 mes";
    if (days === 60) return "2 meses";
    if (days === 90) return "3 meses";
    if (days === 180) return "6 meses";
    if (days === 365) return "1 año";
    return `${days} días`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/user/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al procesar el pago");
      }

      // Si retorna un formulario para Redsys Real, lo enviamos mediante POST
      if (data.isRedsysForm) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.url;

        Object.keys(data.params).forEach((key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = data.params[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Redirigir a la Checkout Session de Stripe o a las simulaciones locales
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de redirección segura del servidor.");
      }
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-2">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400 shadow-sm">
                <CreditCard className="h-6 w-6" />
              </div>
              Mi Suscripción y Cuotas
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Inscribe tu membresía directamente en tu centro deportivo{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {gymName}
              </span>
            </p>
          </div>
          <Link
            href="/configuracion/pagos"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95 shadow-sm shrink-0"
          >
            <Receipt className="h-4 w-4 text-primary" />
            <span>Ver Facturas e Historial</span>
          </Link>
        </div>

          {session?.user?.subscriptionEndDate && session.user.subscriptionStatus === "ACTIVE" ? (
            <div className="mt-5 mb-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Suscripción Activa</p>
                <p className="text-sm text-slate-600 dark:text-slate-355 mt-0.5">
                  Tu pase de acceso es válido hasta el <span className="font-bold text-slate-900 dark:text-white">{new Date(session.user.subscriptionEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 mb-8 rounded-2xl bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/20 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-450 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-450 uppercase tracking-wider">Suscripción Expirada</p>
                <p className="text-sm text-slate-600 dark:text-slate-355 mt-0.5">
                  Tu pase ha vencido. Selecciona un plan a continuación para renovar y activar tu código QR al instante.
                </p>
              </div>
            </div>
          )}
        

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Plan Selection */}
          <div className="md:col-span-7 space-y-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              1. Selecciona tu tarifa
            </h2>
            {isLoadingPlans ? (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <span className="text-xs text-slate-400">Cargando tarifas oficiales...</span>
                </div>
              </div>
            ) : plans.length > 0 ? (
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 relative overflow-hidden",
                      selectedPlanId === plan.id
                        ? "border-primary bg-cyan-50/20 dark:bg-cyan-950/10 shadow-md ring-1 ring-primary/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={cn(
                            "font-bold text-base transition-colors",
                            selectedPlanId === plan.id
                              ? "text-primary dark:text-cyan-400"
                              : "text-slate-900 dark:text-white"
                          )}
                        >
                          {plan.name}
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDuration(plan.durationDays)}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <span
                        className={cn(
                          "text-2xl font-black transition-colors",
                          selectedPlanId === plan.id
                            ? "text-primary dark:text-cyan-400"
                            : "text-slate-900 dark:text-white"
                        )}
                      >
                        {plan.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-1 font-semibold">€</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Mensaje cuando el gimnasio no tiene tarifas dadas de alta */
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900 shadow-sm animate-in fade-in duration-300">
                <Building2 className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  No hay tarifas activas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Este centro deportivo ({gymName}) no ha publicado ninguna tarifa activa en su panel todavía. Ponte en contacto con la administración para que den de alta sus tarifas oficiales.
                </p>
              </div>
            )}
          </div>

          {/* Secure Checkout Section */}
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              2. Pasarela de Pago
            </h2>

            <div className="rounded-2xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md transition-all duration-300">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-450 leading-normal">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Resumen del Pedido */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-850 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-455">
                    <span className="shrink-0">Membresía:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {displayPlanName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-455">
                    <span className="shrink-0">Duración:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {formatDuration(displayDuration)}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 dark:text-white">Total a pagar:</span>
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {displayPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-0.5">€</span>
                    </div>
                  </div>
                </div>

                {paymentGateway ? (
                  <>
                    {/* Explicación de seguridad para el cliente */}
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-500/10 dark:border-emerald-400/20 bg-emerald-500/[0.02] dark:bg-emerald-400/[0.01] p-4 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 font-bold">
                          <Check className="h-4 w-4" />
                          <span>Pago 100% Seguro Encriptado</span>
                        </div>
                        <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                          Serás redirigido de forma segura a la pasarela de pago bancaria oficial de **{gymName}** para completar tu transacción bajo el protocolo de cifrado seguro SSL.
                        </p>
                      </div>

                      {/* Trust Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 justify-center">
                          <Lock className="h-3.5 w-3.5 text-emerald-500" />
                          <span>SSL Encriptado</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 justify-center">
                          <Shield className="h-3.5 w-3.5 text-cyan-500" />
                          <span>PCI-DSS Compliant</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={cn(
                        "flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary py-4 px-6 text-sm font-bold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer",
                        isProcessing && "opacity-75 cursor-not-allowed scale-100 shadow-none"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-white/90" />
                          <span>Proceder al Pago Seguro</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-white dark:bg-slate-900">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Pago online no disponible
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Este centro no tiene un método de pago online configurado todavía. Ponte en contacto con recepción para renovar tu cuota.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
