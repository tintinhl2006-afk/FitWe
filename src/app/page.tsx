"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronRight,
  Heart,
  Salad,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LegalFooter } from "@/components/layout/LegalFooter";

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
          Fideliza a tus clientes con tu propia{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-400 to-cyan-400 bg-clip-text text-transparent">
            plataforma integral
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl animate-fade-in-up animation-delay-200">
          FitWe es el software de gestión para gimnasios que incluye una app premium de nutrición y entrenamiento para tus socios. Aumenta la retención y el valor de tu cuota.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-300">
          <Link
            href="/registro-gimnasio"
            id="cta-gym"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Building2 className="h-5 w-5 text-cyan-400" />
            Registrar mi Gimnasio
            <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        </div>

        </div>

        {/* Dashboard Mockup Image */}
        <div className="mt-16 w-full max-w-6xl animate-fade-in-up animation-delay-400">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/20 bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4">
            <Image
              src="/fitwe_dashboard.png"
              alt="FitWe Dashboard Interface"
              width={1600}
              height={900}
              className="rounded-xl sm:rounded-2xl w-full object-cover"
              priority
            />
            {/* Glowing effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20">
          <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1 bg-slate-950/50 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-white/40 mx-auto animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ APP SHOWCASE SECTION ═══════════════════ */}
      <section className="relative z-10 px-6 py-24 sm:py-32 bg-slate-900/50">
        <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1 relative">
             <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-[100px]" />
             <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
               <Image
                 src="/fitwe_mobile.png"
                 alt="FitWe Mobile App"
                 width={800}
                 height={800}
                 className="w-full h-auto object-cover"
               />
             </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Experiencia Premium para el Socio
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white">
              Tu propio ecosistema móvil.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Tus clientes no solo van a entrenar, vivirán una experiencia completa. Desde la palma de su mano podrán visualizar sus rutinas en 3D, llevar su diario nutricional hiperpersonalizado, reservar clases y pagar su cuota automáticamente.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "Diario Nutricional Interactivo y Macros",
                "Rutinas y Registro de Entrenamientos",
                "Reservas de Clases con un toque",
                "Pagos y Renovaciones automatizadas"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
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
            {/* Card 1 */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500">
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-primary/10 text-cyan-400 group-hover:shadow-soft group-hover:shadow-cyan-500/10 transition-shadow">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Gestión B2B Centralizada
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Controla cuotas, automatiza la reserva de clases y gestiona a todos tus clientes desde un panel de control intuitivo.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-600/0 to-cyan-600/0 group-hover:from-emerald-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 text-emerald-400 group-hover:shadow-soft group-hover:shadow-emerald-500/10 transition-shadow">
                  <Salad className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Valor Añadido para tus Socios
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Ofréceles acceso incluido a la app para que registren sus entrenamientos en vivo y lleven su diario nutricional.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/5 group-hover:to-cyan-600/5 transition-all duration-500" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/10 text-cyan-400 group-hover:shadow-soft group-hover:shadow-cyan-500/10 transition-shadow">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Aumenta la Retención
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Diferénciate de la competencia. Los centros que usan tecnología premium reducen su tasa de abandono en un 40%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA SECTION ═══════════════════ */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-gradient-to-b from-cyan-900/40 to-slate-900 border border-cyan-500/20 p-8 sm:p-16 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-white mb-6">
              Lleva tu gimnasio al siguiente nivel
            </h2>
            <p className="text-lg text-cyan-100/80 max-w-2xl mx-auto mb-10">
              Únete a la red de centros deportivos de élite que confían en FitWe para digitalizar, fidelizar y potenciar su negocio.
            </p>
            <Link
              href="/registro-gimnasio"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-4 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25"
            >
              <Building2 className="h-5 w-5" />
              Registrar mi Centro Deportivo ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <LegalFooter />
    </div>
  );
}
