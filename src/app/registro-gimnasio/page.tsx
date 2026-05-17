"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegistroGimnasioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, location }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Algo salió mal");

      // Redirect to login with a success indicator
      router.push("/login?registered=gym");
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
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-2xl shadow-cyan-500/30">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Únete a la red de centros deportivos <span translate="no" className="notranslate">FitWe</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Gestiona tus clientes, asigna rutinas personalizadas, monitoriza su
            progreso y haz crecer tu negocio con analíticas en tiempo real.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["CRM de clientes", "Rutinas a medida", "Analítica B2B", "Panel de control"].map((f) => (
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
          {/* Mobile branding (hidden on lg) */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-soft shadow-cyan-500/25">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
              Registra tu centro deportivo
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Crea tu cuenta B2B y accede al panel de administración
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-3xl bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Nombre del gimnasio */}
            <div>
              <label htmlFor="gym-name" className="block text-sm font-medium text-slate-300">
                Nombre del Centro Deportivo
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building2 className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="gym-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Ubicación del gimnasio */}
            <div>
              <label htmlFor="gym-location" className="block text-sm font-medium text-slate-300">
                Ubicación del Gimnasio
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="gym-location"
                  name="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="gym-email" className="block text-sm font-medium text-slate-300">
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="gym-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="gym-password" className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="gym-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-3xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-3 text-white shadow-sm placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex w-full justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta de Centro Deportivo"}
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
