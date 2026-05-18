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
  const { data: session, update } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    lastFour: string;
    amount: number;
    endDate: string;
    planName: string;
  } | null>(null);

  const gymName = session?.user?.gymName || "Tu Gimnasio";

  // Fetch available plans from user's gym
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/user/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans);
          // Auto-select current plan or first plan
          if (data.currentPlanId) {
            setSelectedPlanId(data.currentPlanId);
          } else if (data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id);
          }
        }
      } catch (e) {
        console.error("Error fetching plans:", e);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const displayPrice = selectedPlan?.price ?? session?.user?.monthlyFee ?? 49.99;

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

  // Formatea el número de tarjeta con espacios cada 4 dígitos
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Formatea la fecha de expiración como MM/YY
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  // Detectar tipo de tarjeta por prefijo
  const getCardType = (number: string): string => {
    const clean = number.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (/^3[47]/.test(clean)) return "Amex";
    return "";
  };

  const cardType = getCardType(cardNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/user/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          cardHolder,
          expiryDate,
          cvv,
          planId: selectedPlanId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al procesar el pago");
      }

      setSuccess({
        lastFour: data.payment.lastFourDigits,
        amount: data.payment.amount,
        endDate: data.subscription.endDate,
        planName: selectedPlan?.name || "Cuota mensual",
      });

      // Actualizar la sesión para reflejar la nueva suscripción
      await update({
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: data.subscription.endDate,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pantalla de éxito
  if (success) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg">
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              ¡Pago Completado!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Tu suscripción ha sido renovada exitosamente.
            </p>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 mb-6 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Plan</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {success.planName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Importe</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {success.amount.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tarjeta</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  •••• {success.lastFour}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Válido hasta</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {new Date(success.endDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Centro</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {gymName}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
              <Shield className="h-3.5 w-3.5" />
              Pago simulado
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
              <CreditCard className="h-5 w-5" />
            </div>
            Mi Cuota y Suscripción
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Gestiona tu tarifa y pagos en{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {gymName}
            </span>
          </p>

          {session?.user?.subscriptionEndDate && session.user.subscriptionStatus === "ACTIVE" ? (
            <div className="mt-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Suscripción Activa</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tu pase es válido hasta el <span className="font-bold text-slate-200">{new Date(session.user.subscriptionEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-red-500/5 border border-red-500/10 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Suscripción Expirada</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tu cuota ha vencido o está inactiva. Selecciona un plan a continuación para renovarla.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Plan Selection */}
        {isLoadingPlans ? (
          <div className="flex h-24 items-center justify-center mb-6">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : plans.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Elige tu tarifa
            </h2>
            <div className="grid gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all",
                    selectedPlanId === plan.id
                      ? "border-primary bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          "font-bold",
                          selectedPlanId === plan.id
                            ? "text-primary dark:text-cyan-400"
                            : "text-slate-900 dark:text-white"
                        )}
                      >
                        {plan.name}
                      </h3>
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {formatDuration(plan.durationDays)}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span
                      className={cn(
                        "text-xl font-black",
                        selectedPlanId === plan.id
                          ? "text-primary dark:text-cyan-400"
                          : "text-slate-900 dark:text-white"
                      )}
                    >
                      {plan.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500 ml-0.5">€</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback when gym has no plans */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{gymName}</span>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Mensual
              </span>
            </div>
            <div className="text-4xl font-bold">
              {displayPrice.toFixed(2)}{" "}
              <span className="text-xl font-normal text-slate-400">€</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Cuota del mes · 30 días de acceso
            </p>
          </div>
        )}

        {/* Payment form */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Card number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Número de tarjeta
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-10 pr-20 text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  placeholder="4242 4242 4242 4242"
                />
                {cardType && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {cardType}
                  </span>
                )}
              </div>
            </div>

            {/* Card holder */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Titular de la tarjeta
              </label>
              <input
                type="text"
                autoComplete="cc-name"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm uppercase tracking-wider focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                placeholder="NOMBRE APELLIDO"
              />
            </div>

            {/* Expiry + CVV row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Expiración
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  placeholder="MM/AA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  CVV
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    placeholder="•••"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isProcessing}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-soft shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all",
                isProcessing && "opacity-70 cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pagar {displayPrice.toFixed(2)} €
                </>
              )}
            </button>

            {/* Security notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-2">
              <Shield className="h-3.5 w-3.5" />
              Pago simulado · Validación de formato únicamente
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
