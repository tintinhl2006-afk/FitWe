"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredGym = searchParams.get("registered") === "gym";
  const registeredClient = searchParams.get("registered") === "client";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setIsLoading(false);
      setError("Email o contraseña incorrectos");
    } else {
      // Fetch session to determine role-based redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "GYM") {
        router.push("/admin-gym");
      } else if (session?.user?.role === "EMPLOYEE") {
        router.push("/admin-gym/clases");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-soft border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center text-center">
          <img src="/fitwe-icon.png" alt="FitWe Logo" className="h-40 w-40 object-contain mb-6" />
          <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            <span translate="no" className="notranslate">Fit<span className="text-primary">We</span></span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>

        {registeredGym && (
          <div className="rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 p-3 text-sm text-primary dark:text-cyan-300 text-center">
            Centro deportivo registrado con éxito. ¡Inicia sesión para acceder a tu panel!
          </div>
        )}

        {registeredClient && (
          <div className="rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 p-3 text-sm text-primary dark:text-cyan-300 text-center">
            Cuenta de atleta creada con éxito. ¡Inicia sesión para continuar!
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Correo electrónico
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex w-full justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm flex flex-col items-center">
          <div>
            <span className="text-slate-600 dark:text-slate-400">¿Eres un atleta y no tienes cuenta? </span>
            <Link href="/registro" className="font-medium text-primary dark:text-cyan-400 hover:underline">
              Regístrate aquí
            </Link>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">¿Eres un gimnasio y quieres unirte a FitWe? </span>
            <a
              href="mailto:tudesarrollodigital@gmail.com?subject=Quiero%20una%20demo%20de%20FitWe"
              className="font-medium text-primary dark:text-cyan-400 hover:underline"
            >
              Contáctanos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
