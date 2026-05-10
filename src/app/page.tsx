"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronRight,
  Heart,
  Salad,
  Sparkles,
  Zap,
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* ── Ambient background effects ── */}
      <div className="pointer-events-none fixed inset-0">
        {/* Top-left glow */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[120px]" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        {/* Center subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <LandingNavbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-16 pb-24 text-center">
        {/* Badge removed as requested */}
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
          Revoluciona tu forma de{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-400 to-cyan-400 bg-clip-text text-transparent">
            entrenar y gestionar
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl animate-fade-in-up animation-delay-200">
          Registra tus entrenamientos en tiempo real, lleva el control de tu
          nutrición y gestiona tu centro deportivo desde un solo lugar.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-300">
          <Link
            href="/register"
            id="cta-athlete"
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Heart className="h-5 w-5" />
            Soy Atleta · Empezar Gratis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/registro-gimnasio"
            id="cta-gym"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Building2 className="h-5 w-5 text-cyan-400" />
            Soy Centro Deportivo
            <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
            <div className="h-2 w-2 rounded-full bg-white/40 mx-auto animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES SECTION ═══════════════════ */}
      <section id="features" className="relative z-10 px-6 pb-32">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Características
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Todo lo que necesitas,{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
              Tres pilares que transforman la experiencia deportiva para atletas
              y centros de fitness.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 – Seguimiento en Vivo */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500">
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-primary/10 text-cyan-400 group-hover:shadow-soft group-hover:shadow-cyan-500/10 transition-shadow">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Seguimiento en Vivo
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Registra cada serie, repetición y peso en tiempo real durante
                  tu sesión de entrenamiento. Visualiza tu progreso histórico y
                  rompe tus propios récords.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  Explorar
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Card 2 – Planes Nutricionales */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-600/0 to-cyan-600/0 group-hover:from-emerald-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 text-emerald-400 group-hover:shadow-soft group-hover:shadow-emerald-500/10 transition-shadow">
                  <Salad className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Planes Nutricionales
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Controla tus calorías diarias, macronutrientes y hábitos
                  alimenticios con un registro intuitivo. Alcanza tus objetivos
                  de composición corporal.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  Explorar
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Card 3 – Gestión Integral B2B */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/10 text-cyan-400 group-hover:shadow-soft group-hover:shadow-cyan-500/10 transition-shadow">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Gestión Integral B2B
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Panel de administración completo para centros deportivos: CRM
                  de clientes, asignación de rutinas, métricas agregadas y
                  analítica en tiempo real.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  Explorar
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} <span translate="no" className="notranslate">FitWe</span>. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
