"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, Dumbbell, CalendarRange, Apple, LogIn, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

const navItems: (NavItem & { protected?: boolean })[] = [
  {
    title: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    title: "Gimnasio",
    href: "/gimnasio",
    icon: Dumbbell,
  },
  {
    title: "Entrenamientos",
    href: "/entrenamientos",
    icon: CalendarRange,
    protected: true,
  },
  {
    title: "Nutrición",
    href: "/nutricion",
    icon: Apple,
    protected: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const filteredNavItems = navItems.filter(
    (item) => !item.protected || status === "authenticated"
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-6 transition-colors">
      <div className="mb-8 px-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        FitManager
      </div>
      <nav className="flex-1 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              {item.title}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
        {status === "authenticated" ? (
          <>
            <Link href="/perfil" className="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 overflow-hidden">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {session.user?.name || "Usuario"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {session.user?.role?.toLowerCase() || "Cliente"}
                </span>
              </div>
            </Link>
            <div className="space-y-1">
              <Link
                href="/configuracion"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  pathname.startsWith("/configuracion")
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Settings className="h-5 w-5" />
                Configuración
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
          >
            <LogIn className="h-5 w-5" />
            Iniciar Sesión
          </Link>
        )}
      </div>
    </div>
  );
}
