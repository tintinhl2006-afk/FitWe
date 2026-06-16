"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de restablecimiento inválido o ausente en el enlace de recuperación.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de restablecimiento inválido o ausente.");
      return;
    }

    if (password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas introducidas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al restablecer la contraseña.");
      }

      setSuccess(true);

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de red al conectar con el servidor.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative z-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Restablecer Contraseña
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Introduce tu nueva contraseña definitiva a continuación para recuperar el acceso a tu cuenta.
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-500/5 dark:bg-emerald-500/[0.03] p-6 text-center space-y-3 animate-in zoom-in duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contraseña Restablecida</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Contraseña guardada con éxito. Redirigiendo a la pantalla de acceso...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nueva Contraseña */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isSubmitting || !token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-955 py-3.5 pl-4 pr-10 text-sm text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <button
                type="button"
                disabled={!token}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={isSubmitting || !token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-xl border border-slate-355 dark:border-slate-700 bg-white dark:bg-slate-955 py-3.5 pl-4 pr-10 text-sm text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <button
                type="button"
                disabled={!token}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-[#06b6d4]/90 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-2",
              (isSubmitting || !token) && "opacity-75 cursor-not-allowed scale-100 shadow-none"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Restableciendo contraseña...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <Suspense fallback={
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-xl relative z-10 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-slate-400 mt-2">Cargando verificación...</span>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
