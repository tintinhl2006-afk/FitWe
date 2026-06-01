"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Lock,
  ArrowLeft,
  AlertCircle,
  Shield,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

function RedsysLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-100 text-slate-650 p-6">
      <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-2" />
      <span className="text-sm font-semibold">Cargando TPV Virtual Seguro de Redsys...</span>
    </div>
  );
}

function RedsysContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amountStr = searchParams.get("amount") || "49.99";
  const planId = searchParams.get("planId") || "";

  const amount = parseFloat(amountStr);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [order, setOrder] = useState("");

  useEffect(() => {
    // Generar un número de pedido ficticio de 12 dígitos para emular Redsys
    const dummyOrder = `${Date.now().toString().slice(-10)}${Math.floor(10 + Math.random() * 90)}`;
    setOrder(dummyOrder);
  }, []);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Número de tarjeta inválido (debe tener 16 dígitos).");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Simular la llamada del webhook en el servidor para activar la suscripción e ingresar la cuota en local
      const queryParams = new URLSearchParams();
      queryParams.set("mock", "true");
      queryParams.set("order", order);
      if (planId) queryParams.set("planId", planId);

      const res = await fetch(`/api/user/payment/verify?${queryParams.toString()}`);
      
      if (!res.ok) {
        throw new Error("La pasarela bancaria rechazó la operación simulada.");
      }

      // Esperar 1.5s para emular el procesamiento de seguridad bancaria 3D Secure
      setTimeout(() => {
        // Redirigir al cliente de vuelta a la página de éxito de FitWe
        router.push(`/dashboard/pago/success?mock=true&order=${order}${planId ? `&planId=${planId}` : ""}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al conectar con la pasarela bancaria.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex flex-col antialiased">
      {/* Cabecera Clásica Roja de Redsys */}
      <header className="bg-[#E30613] text-white py-4 px-6 shadow-md shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-widest text-lg border border-white px-2 py-0.5 rounded-lg">Redsys</span>
            <div className="h-4 w-px bg-white/40" />
            <span className="text-xs font-bold tracking-wide uppercase opacity-90 hidden sm:inline">Pago Seguro mediante TPV Virtual Bancario</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10 uppercase">
            ENTORNO SIMULACIÓN
          </span>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Detalle del Comercio (Izquierda) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm text-sm">
          <h2 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
            Detalles del Comercio
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Comercio</p>
              <p className="font-bold text-slate-800 dark:text-slate-250">FitWe Gym Platform</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Número de Terminal</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">001</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Número de Pedido</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{order}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Importe Total</p>
              <p className="text-3xl font-black text-red-650 dark:text-red-400">
                {amount.toFixed(2)} <span className="text-lg font-bold">EUR</span>
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Entrada de Tarjeta (Derecha) */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handlePay} className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-650" />
                Introduzca los datos de su tarjeta
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conexión encriptada directa con el banco bajo el protocolo de pago seguro 3D Secure.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3.5 text-xs font-semibold text-red-700 dark:text-red-450">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Número de Tarjeta */}
            <div>
              <label htmlFor="card-number" className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                Número de Tarjeta
              </label>
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Caducidad */}
              <div>
                <label htmlFor="expiry-date" className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Fecha Caducidad (MM/AA)
                </label>
                <input
                  id="expiry-date"
                  type="text"
                  inputMode="numeric"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                />
              </div>

              {/* CVV */}
              <div>
                <label htmlFor="cvv-code" className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Código de Seguridad (CVV)
                </label>
                <input
                  id="cvv-code"
                  type="password"
                  inputMode="numeric"
                  maxLength={3}
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="•••"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Acción de enviar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="submit"
                disabled={isProcessing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 text-sm shadow-md transition-colors cursor-pointer",
                  isProcessing && "opacity-75 cursor-not-allowed bg-red-650 hover:bg-red-650"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Procesando firma segura...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-white/90" />
                    <span>Autorizar Pago Ficticio</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => router.push("/dashboard/pago")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold py-3.5 px-6 text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Cancelar y Volver</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide uppercase pt-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Conexión Protegida mediante Encriptación SSL de 256 bits</span>
            </div>
          </form>
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 py-4 px-6 text-center text-[10px] text-slate-405 dark:text-slate-500 shrink-0 font-medium tracking-wide uppercase">
        © {new Date().getFullYear()} Redsys Servicios de Procesamiento · Todos los derechos reservados
      </footer>
    </div>
  );
}

export default function RedsysMockPage() {
  return (
    <Suspense fallback={<RedsysLoading />}>
      <RedsysContent />
    </Suspense>
  );
}
