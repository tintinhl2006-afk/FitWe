"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Loader2,
  Building2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StripeMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const amountParam = searchParams.get("amount") || "49.99";
  const planName = searchParams.get("planName") || "Cuota mensual";
  const planId = searchParams.get("planId") || "";

  const gymName = session?.user?.gymName || "Tu Gimnasio";
  const amount = parseFloat(amountParam);

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill user email from session
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    // Format card number with spaces (e.g. 4242 4242 ...)
    const matches = value.match(/\d{1,4}/g);
    const matchString = matches ? matches.join(" ") : "";
    setCardNumber(matchString);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("El número de tarjeta debe tener 16 dígitos.");
      return;
    }
    if (expiry.length < 5) {
      setError("Introduce una fecha de caducidad válida (MM/AA).");
      return;
    }
    if (cvc.length < 3) {
      setError("Introduce un código de seguridad (CVC) válido.");
      return;
    }
    if (!cardName.trim()) {
      setError("Introduce el nombre del titular de la tarjeta.");
      return;
    }

    setIsProcessing(true);

    // Simulate Stripe bank delay
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);

      // Generate a unique simulated session ID for Stripe mock
      const mockSessionId = `mock_stripe_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // Redirect to the success verify endpoint
      setTimeout(() => {
        const successUrl = `/dashboard/pago/success?mock=true&session_id=${mockSessionId}${planId ? `&planId=${planId}` : ""}`;
        router.push(successUrl);
      }, 1200);
    }, 2500);
  };

  const fillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/29");
    setCvc("424");
    setCardName(session?.user?.name || "Martín");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#30313D] font-sans antialiased flex flex-col md:flex-row">
      {/* LEFT SIDEBAR: Order info (resembling standard Stripe Checkout left panel) */}
      <div className="w-full md:w-[45%] bg-white md:bg-transparent p-6 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
        <div className="space-y-8">
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard/pago")}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>

          {/* Product details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              <Building2 className="h-4 w-4" />
              <span>{gymName}</span>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-slate-500">Membresía</h2>
              <h1 className="text-3xl font-black text-[#1F2029] tracking-tight mt-1">{planName}</h1>
            </div>

            <div className="flex items-baseline gap-1 pt-4 border-t border-slate-200/60">
              <span className="text-4xl font-black text-[#1F2029]">{amount.toFixed(2)}</span>
              <span className="text-xl font-bold text-slate-500">€</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="hidden md:block pt-8 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-[#00D4B2]">
            <ShieldCheck className="h-4 w-4" />
            <span>Simulador Local Stripe Activo</span>
          </div>
          <p className="leading-normal">
            Esta es una pasarela de pago local simulada de Stripe. No se realizará ningún cargo real en tu tarjeta de crédito.
          </p>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Standard Stripe payment form */}
      <div className="flex-1 p-6 md:p-16 flex items-center justify-center max-w-xl mx-auto w-full">
        <div className="w-full space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-[#635BFF] rounded-md flex items-center justify-center text-white text-[10px] font-black tracking-widest shadow-sm">
                stripe
              </div>
              <span className="text-xs font-bold text-slate-400">Checkout (Demostración)</span>
            </div>
            <button
              onClick={fillTestCard}
              className="text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-3xl bg-cyan-500/10 text-primary dark:text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              Autorellenar tarjeta test
            </button>
          </div>

          {success ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-lg space-y-4 animate-in zoom-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¡Pago Procesado!</h3>
              <p className="text-sm text-slate-500">
                Conexión segura establecida. Redirigiendo a tu recibo digital...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm text-slate-900 shadow-sm focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10 outline-none transition-all"
                />
              </div>

              {/* Card info container */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Datos de la tarjeta
                </label>
                
                <div className="rounded-xl border border-slate-350 bg-white shadow-sm overflow-hidden divide-y divide-slate-300 focus-within:ring-2 focus-within:ring-[#635BFF]/15 focus-within:border-[#635BFF] transition-all">
                  {/* Card number */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 1234 5678"
                      className="w-full py-3.5 pl-4 pr-10 text-sm text-slate-900 bg-transparent border-0 outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Expiry and CVC grid */}
                  <div className="grid grid-cols-2 divide-x divide-slate-300">
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/AA"
                      className="w-full py-3.5 px-4 text-sm text-slate-900 bg-transparent border-0 outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={handleCvcChange}
                      placeholder="CVC"
                      className="w-full py-3.5 px-4 text-sm text-slate-900 bg-transparent border-0 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Holder Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nombre y apellidos"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm text-slate-900 shadow-sm focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10 outline-none transition-all"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  País o región
                </label>
                <select
                  disabled
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-4 text-sm text-slate-500 shadow-sm outline-none cursor-not-allowed"
                >
                  <option value="ES">España</option>
                </select>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={cn(
                  "flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5951e5] py-4 px-6 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer",
                  isProcessing && "opacity-75 cursor-not-allowed scale-100 shadow-none"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-white/90" />
                    <span>Pagar {amount.toFixed(2)} €</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Trust information */}
          <div className="text-[10px] text-slate-400 text-center uppercase tracking-wider flex items-center justify-center gap-1">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>Encriptación Segura TLS de 256 bits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StripeMockPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#635BFF]" />
      </div>
    }>
      <StripeMockContent />
    </Suspense>
  );
}
