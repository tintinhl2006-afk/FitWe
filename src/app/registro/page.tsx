"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Loader2, CheckCircle2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegistroClientePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymCode, setGymCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, gymCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Algo salió mal");

      // Redirect to login with a success indicator
      router.push("/login?registered=client");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Global Background glows */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-600/15 blur-[120px]" />
      </div>

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col items-center justify-center">
        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-2xl shadow-cyan-500/30 animate-[pulse_4s_infinite]">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Tu viaje fitness personalizado en <span translate="no" className="notranslate">FitWe</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Lleva tu diario nutricional, registra entrenamientos en vivo, reserva clases colectivas y consulta tus planes en cualquier momento.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["Rutinas 3D", "Control calórico", "Clases grupales", "Facturas en PDF"].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-cyan-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile branding */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-soft shadow-cyan-500/25">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
              Crea tu cuenta de Atleta
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Ingresa tus datos y el código de tu gimnasio para comenzar
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-3xl bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-slate-300">
                Nombre Completo
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="client-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-slate-300">
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="client-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Ej. juan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="client-password" className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="client-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Código de Gimnasio */}
            <div>
              <label htmlFor="client-gymCode" className="block text-sm font-medium text-slate-300">
                Código de Gimnasio
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Dumbbell className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="client-gymCode"
                  name="gymCode"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Ej. FITWE1"
                  value={gymCode}
                  onChange={(e) => setGymCode(e.target.value.toUpperCase())}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm tracking-widest font-mono font-bold"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Solicita el código de vinculación directamente a tu centro deportivo.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex w-full justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta de Atleta"}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-500">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
