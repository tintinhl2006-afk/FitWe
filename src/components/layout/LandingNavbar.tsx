"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Dumbbell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const panelHref =
    session?.user?.role === "GYM" ? "/admin-gym" : "/dashboard";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-soft shadow-black/10"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <img src="/fitwe-icon.png" alt="FitWe Logo" className="h-16 w-16 object-contain transition-transform group-hover:scale-110" />
            <span className="text-4xl font-black tracking-tighter text-white">
              <span translate="no" className="notranslate">Fit<span className="text-cyan-400">We</span></span>
            </span>
          </Link>

          {/* Desktop CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {status === "authenticated" ? (
              <Link
                href={panelHref}
                className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Ir a mi Panel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-3xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden flex h-10 w-10 items-center justify-center rounded-3xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "sm:hidden overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-60 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl" : "max-h-0"
        )}
      >
        <div className="px-6 py-4 space-y-3">
          {status === "authenticated" ? (
            <Link
              href={panelHref}
              className="block w-full text-center rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
            >
              Ir a mi Panel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="block w-full text-center rounded-3xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:border-white/20 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="block w-full text-center rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
