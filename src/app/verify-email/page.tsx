"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enlace de verificación inválido o incompleto.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al verificar el email.");
        setStatus("success");
        setMessage(data.message);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error de red al conectar con el servidor.");
      }
    })();
  }, [token]);

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative z-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Verificación de Email
        </h1>
      </div>

      {status === "verifying" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Verificando tu email...</p>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-500/5 dark:bg-emerald-500/[0.03] p-6 text-center space-y-3 animate-in zoom-in duration-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Verificado</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-[#06b6d4]/90 py-3 px-6 text-sm font-bold text-white shadow-md transition-all mt-2"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No se pudo verificar</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 py-3 px-6 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mt-2"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-xl relative z-10 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
