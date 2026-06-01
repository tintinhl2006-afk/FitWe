"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Lock,
  Key,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Stripe Settings
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [stripeConnected, setStripeConnected] = useState(false);
  
  // Redsys Settings
  const [redsysFuc, setRedsysFuc] = useState("");
  const [redsysTerminal, setRedsysTerminal] = useState("001");
  const [redsysClave, setRedsysClave] = useState("");
  const [redsysEnabled, setRedsysEnabled] = useState(false);

  // UI States
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [showManualStripe, setShowManualStripe] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        if (data.role === "GYM") {
          setStripeSecretKey(data.stripeSecretKey || "");
          setStripePublishableKey(data.stripePublishableKey || "");
          setStripeAccountId(data.stripeAccountId || "");
          setStripeConnected(!!data.stripeConnected);
          
          setRedsysFuc(data.redsysFuc || "");
          setRedsysTerminal(data.redsysTerminal || "001");
          setRedsysClave(data.redsysClave || "");
          setRedsysEnabled(!!data.redsysEnabled);
        }
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle Stripe Connect redirect status verification
  useEffect(() => {
    const status = searchParams.get("stripe_status");
    if (status) {
      const verifyStripeStatus = async () => {
        setIsConnectingStripe(true);
        try {
          const res = await fetch("/api/admin-gym/stripe/status");
          const data = await res.json();
          if (res.ok && data.stripeConnected) {
            setStripeConnected(true);
            setStripeAccountId(data.stripeAccountId || "");
            showToast("success", data.isMock 
              ? "¡Conectado con Stripe Connect (Demostración) con éxito!" 
              : "¡Tu cuenta Stripe Connect se ha enlazado correctamente!");
          } else {
            showToast("error", "No se completó el onboarding de Stripe Connect. Inténtalo de nuevo.");
          }
        } catch (e) {
          console.error("Error verifying Stripe Connect:", e);
          showToast("error", "Error al verificar el estado de Stripe Connect.");
        } finally {
          setIsConnectingStripe(false);
          router.replace("/admin-gym/configuracion");
        }
      };
      verifyStripeStatus();
    }
  }, [searchParams, router]);

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    try {
      const res = await fetch("/api/admin-gym/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al iniciar Stripe Connect");
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      showToast("error", err.message || "Error al conectar con Stripe.");
      setIsConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm("¿Estás seguro de que deseas desconectar tu cuenta Stripe? Los socios no podrán realizar pagos online mediante Stripe hasta que vuelvas a conectarte.")) {
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeDisconnect: true }),
      });
      
      if (res.ok) {
        setStripeConnected(false);
        setStripeAccountId("");
        showToast("success", "Cuenta Stripe desconectada con éxito.");
      } else {
        const data = await res.json();
        throw new Error(data.message || "Error al desconectar");
      }
    } catch (err: any) {
      showToast("error", err.message || "No se pudo desconectar Stripe.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const body: Record<string, any> = { name: name.trim() };
      if (newPassword.length > 0) {
        body.newPassword = newPassword;
      }

      if (user.role === "GYM") {
        body.stripeSecretKey = stripeSecretKey;
        body.stripePublishableKey = stripePublishableKey;
        
        body.redsysFuc = redsysFuc;
        body.redsysTerminal = redsysTerminal;
        body.redsysClave = redsysClave;
        body.redsysEnabled = redsysEnabled;
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al guardar");
      }

      // Sync NextAuth session
      await update({ name: name.trim() });

      setNewPassword("");
      showToast("success", data.message || "Cambios guardados correctamente");
    } catch (err: any) {
      showToast("error", err.message || "Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "absolute -top-4 left-0 right-0 mx-auto max-w-md rounded-3xl border px-4 py-3 text-sm font-medium shadow-soft transition-all animate-fade-in-up flex items-center gap-2 z-10",
            toast.type === "success"
              ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800 text-primary dark:text-cyan-300"
              : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        {/* Name field */}
        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nombre del Centro
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm"
            />
          </div>
        </div>

        {/* Email field (disabled) */}
        <div>
          <label htmlFor="settings-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-email"
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-slate-500 dark:text-slate-500 cursor-not-allowed sm:text-sm"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            El correo electrónico no se puede modificar por seguridad.
          </p>
        </div>

        {/* New password field */}
        <div>
          <label htmlFor="settings-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nueva Contraseña <span className="text-slate-400 dark:text-slate-600 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm"
              placeholder="Déjalo vacío para no cambiar"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            Mínimo 6 caracteres. Solo se actualiza si introduces una nueva.
          </p>
        </div>

        {/* Gym settings section */}
        {user.role === "GYM" && (
          <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Configuración de Pasarelas de Pago
            </h3>

            {/* STRIPE CONNECT PANEL */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Pasarela Stripe Connect (Tarjeta / Apple Pay / Google Pay)
                  </h4>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-cyan-500/10 text-primary dark:text-cyan-400">
                  RECOMENDADO
                </span>
              </div>

              {stripeConnected ? (
                /* ESTADO: CONECTADO */
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">
                        Stripe Connect Enlazado
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tus clientes pueden pagar online. Tus ingresos se transferirán a tu banco de inmediato.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="font-mono text-slate-400">
                      ID: {stripeAccountId ? `${stripeAccountId.slice(0, 12)}...` : "acct_connect_active"}
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectStripe}
                      className="text-rose-500 hover:text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Desconectar Stripe
                    </button>
                  </div>
                </div>
              ) : (
                /* ESTADO: DESCONECTADO */
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Vincula tu cuenta bancaria de Stripe para cobrar online al instante sin teclear códigos complejos.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium pb-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span>Soporta Apple Pay y Google Pay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span>Liquidación directa automática</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe}
                    className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-2xl bg-[#635BFF] hover:bg-[#5951e5] px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {isConnectingStripe ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 text-white" />
                        <span>Conectar con Stripe</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* TPV VIRTUAL REDSYS PANEL */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", redsysEnabled ? "bg-emerald-500" : "bg-slate-400")} />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    TPV Virtual Redsys (Banca Tradicional)
                  </h4>
                </div>
                
                {/* Switch de habilitación */}
                <button
                  type="button"
                  onClick={() => setRedsysEnabled(!redsysEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                    redsysEnabled ? "bg-emerald-500" : "bg-slate-350 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      redsysEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Activa el cobro mediante el TPV de tu banco tradicional (CaixaBank, BBVA, Santander, Sabadell, etc.) para beneficiarte de comisiones mínimas negociadas directamente con tu entidad bancaria.
              </p>

              {redsysEnabled && (
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-850 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* FUC Input */}
                    <div>
                      <label htmlFor="redsys-fuc" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Número de Comercio (FUC)
                      </label>
                      <input
                        id="redsys-fuc"
                        type="text"
                        value={redsysFuc}
                        onChange={(e) => setRedsysFuc(e.target.value.replace(/\D/g, ""))}
                        required={redsysEnabled}
                        placeholder="Ej. 349281723"
                        className="w-full rounded-2xl border border-slate-350 dark:border-slate-750 bg-white dark:bg-slate-900 py-2 px-3 text-slate-900 dark:text-white sm:text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    {/* Terminal Input */}
                    <div>
                      <label htmlFor="redsys-terminal" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Número de Terminal
                      </label>
                      <input
                        id="redsys-terminal"
                        type="text"
                        value={redsysTerminal}
                        onChange={(e) => setRedsysTerminal(e.target.value.replace(/\D/g, ""))}
                        required={redsysEnabled}
                        placeholder="001"
                        className="w-full rounded-2xl border border-slate-350 dark:border-slate-750 bg-white dark:bg-slate-900 py-2 px-3 text-slate-900 dark:text-white sm:text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Secret HMAC Key Input */}
                  <div>
                    <label htmlFor="redsys-clave" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Clave de Encriptación SHA-256 (Clave Secreta)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Key className="h-4 w-4 text-slate-455" />
                      </div>
                      <input
                        id="redsys-clave"
                        type="password"
                        value={redsysClave}
                        onChange={(e) => setRedsysClave(e.target.value)}
                        required={redsysEnabled}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full rounded-2xl border border-slate-350 dark:border-slate-750 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-slate-900 dark:text-white sm:text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-405 dark:text-slate-500 leading-normal">
                      Clave secreta provista por tu entidad bancaria (debe ser decodificada y guardada en formato Base64 estándar). En local para simulador, introduce `mock`.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CONFIGURACIÓN MANUAL AVANZADA (LEGACY STRIPE KEYS) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowManualStripe(!showManualStripe)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/30 text-left text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span>CLAVES MANUALES INDEPENDIENTES DE STRIPE (EXPERTOS)</span>
                {showManualStripe ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showManualStripe && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <p className="text-[11px] text-amber-600 dark:text-amber-450 leading-relaxed font-semibold">
                    ▲ Atención: Configura tus propias claves API desde el Dashboard de Stripe si deseas operar sin el enrutador Connect.
                  </p>

                  {/* Stripe Publishable Key */}
                  <div>
                    <label htmlFor="settings-stripe-pub" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Clave Pública de Stripe (Stripe Publishable Key)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Key className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        id="settings-stripe-pub"
                        type="text"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="pk_test_..."
                        className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Stripe Secret Key */}
                  <div>
                    <label htmlFor="settings-stripe-sec" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Clave Secreta de Stripe (Stripe Secret Key)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Key className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        id="settings-stripe-sec"
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-2 rounded-3xl bg-primary hover:bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-soft",
              isSaving && "opacity-60 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
