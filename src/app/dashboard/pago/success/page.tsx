"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Building2,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Receipt,
  Shield,
  Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaymentDetails {
  id: string;
  amount: number;
  date: string;
  planName: string;
  cardLast4: string;
  cardBrand: string;
  gymName: string;
  endDate: string;
  invoiceNumber?: string | null;
}

function PagoLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
        <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
        Verificando pago seguro...
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Por favor, no cierres esta ventana ni recargues la página. Estamos confirmando la transacción directamente con tu entidad bancaria y actualizando tu pase.
      </p>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  const sessionId = searchParams.get("session_id");
  const mock = searchParams.get("mock") === "true" || searchParams.get("mock_redsys") === "true";
  const planId = searchParams.get("planId");
  const stripeConnect = searchParams.get("stripe_connect") === "true";
  const methodId = searchParams.get("methodId");
  const order = searchParams.get("order");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (sessionId) queryParams.set("session_id", sessionId);
        if (mock) queryParams.set("mock", "true");
        if (planId) queryParams.set("planId", planId);
        if (stripeConnect) queryParams.set("stripe_connect", "true");
        if (methodId) queryParams.set("methodId", methodId);
        if (order) queryParams.set("order", order);

        const res = await fetch(`/api/user/payment/verify?${queryParams.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || "No se pudo verificar el pago");
        }

        setPaymentDetails(data.payment);

        // Actualizar los datos de la sesión de NextAuth local
        await update({
          subscriptionStatus: "ACTIVE",
          subscriptionEndDate: data.payment.endDate,
        });

        setStatus("success");
      } catch (err: any) {
        console.error("Error al verificar el pago:", err);
        setError(err.message || "Error de verificación.");
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId, mock, planId, methodId, order, update]);

  // Pantalla de Cargando
  if (status === "loading") {
    return <PagoLoading />;
  }

  // Pantalla de Error
  if (status === "error" || !paymentDetails) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-rose-100 dark:border-rose-950 bg-white dark:bg-slate-900 p-8 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30">
            <XCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            Error de Verificación
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {error || "Ha ocurrido un problema al verificar el estado de tu pago. Si el cobro se ha realizado en tu tarjeta, por favor ponte en contacto con tu gimnasio."}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard/pago"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 px-6 text-sm font-bold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Reintentar / Volver a Intentar
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 px-6 text-sm font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Ir al Dashboard Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Éxito
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-emerald-250 dark:border-emerald-950/60 bg-white dark:bg-slate-900 p-8 shadow-xl relative overflow-hidden">
        {/* Banner decorativo */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-500 animate-pulse" />
        
        {/* Icono de Check */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.05] animate-bounce duration-1000">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 dark:text-emerald-450" />
        </div>

        <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white tracking-tight">
          ¡Pago Confirmado!
        </h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2 mb-8 max-w-xs mx-auto">
          Membresía activada de inmediato. Ya puedes usar tu código QR en el torno de acceso.
        </p>

        {/* Factura / Recibo Elegante */}
        <div className="relative rounded-2xl bg-slate-50 dark:bg-slate-950 p-6 mb-8 border border-slate-100 dark:border-slate-850 overflow-hidden">
          {/* Círculos laterales de corte de ticket de compra */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-850" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-850" />

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 justify-between">
            <div className="flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5" />
              <span>RECIBO DE TRANSACCIÓN</span>
            </div>
            <span>FITWE PAY</span>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Plan Contratado</span>
              <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.planName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Centro Deportivo</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {paymentDetails.gymName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Método de Pago</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{paymentDetails.cardBrand.toUpperCase()} •••• {paymentDetails.cardLast4}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Fecha del Cobro</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {new Date(paymentDetails.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Nº de Factura</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                {paymentDetails.invoiceNumber || `F-${paymentDetails.id.slice(0, 8).toUpperCase()}`}
              </span>
            </div>

            <div className="h-px border-t border-dashed border-slate-250 dark:border-slate-800 my-4" />

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Válido Hasta</span>
              <span className="font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5 bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/10 px-2.5 py-1 rounded-xl">
                <Calendar className="h-4 w-4 shrink-0" />
                {new Date(paymentDetails.endDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Importe Satisfecho</span>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {paymentDetails.amount.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-0.5">€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Verification Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium mb-8">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>Verificación Bancaria Segura con Encriptación SSL</span>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 px-6 text-sm font-bold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Ir al Dashboard Principal</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PagoSuccessPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PagoLoading />}>
        <SuccessContent />
      </Suspense>
    </DashboardLayout>
  );
}
