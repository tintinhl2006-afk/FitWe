"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  Calendar,
  Menu,
  X,
  Tag,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

const gymNavItems = [
  { title: "Dashboard", href: "/admin-gym", icon: LayoutDashboard },
  { title: "Control de Acceso", href: "/admin-gym/acceso", icon: QrCode },
  { title: "Clientes", href: "/admin-gym/clientes", icon: Users },
  { title: "Tarifas", href: "/admin-gym/tarifas", icon: Tag },
  { title: "Clases", href: "/admin-gym/clases", icon: Calendar },
  { title: "Estadísticas", href: "/admin-gym/estadisticas", icon: BarChart3 },

  { title: "Configuración", href: "/admin-gym/configuracion", icon: Settings },
];

export function AdminGymSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-4 px-6 py-10 border-b border-slate-100 dark:border-slate-800">
        <img src="/fitwe-icon.png" alt="FitWe" className="h-20 w-20 object-contain" />
        <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
          <span translate="no" className="notranslate">Fit<span className="text-primary">We</span></span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {gymNavItems.map((item) => {
          const isActive =
            item.href === "/admin-gym"
              ? pathname === "/admin-gym"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition-all group",
                isActive
                  ? "bg-cyan-50 dark:bg-cyan-950/40 text-primary dark:text-cyan-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-primary dark:text-cyan-400"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
              />
              {item.title}
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 text-cyan-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-primary dark:text-cyan-400 text-sm font-bold">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "G"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {session?.user?.name || "Administrador"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
              Gestor de Gimnasio
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-3xl px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="flex lg:hidden fixed top-0 left-0 right-0 w-full px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40 items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
          <span translate="no" className="notranslate">Fit<span className="text-primary">We</span></span>
        </span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in overlay */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-50 transition-transform duration-300 ease-in-out flex",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
