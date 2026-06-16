"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Introduce una dirección de correo electrónico válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al enviar la solicitud.");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de red al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Introduce tu correo electrónico y te enviaremos las instrucciones necesarias para restablecer tu contraseña.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-500/5 dark:bg-emerald-500/[0.03] p-6 text-center space-y-4 animate-in zoom-in duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Correo Enviado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Si el correo electrónico existe en nuestra base de datos, recibirás un enlace seguro para restablecer tu contraseña en los próximos minutos.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-primary dark:text-cyan-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950 py-3.5 px-4 text-sm text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-[#06b6d4]/90 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-2",
                isSubmitting && "opacity-75 cursor-not-allowed scale-100 shadow-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Enviando enlace...</span>
                </>
              ) : (
                <span>Enviar Instrucciones</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al Inicio de Sesión</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
