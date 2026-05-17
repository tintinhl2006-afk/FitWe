import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, Dumbbell, CalendarRange, Calendar, Apple, LogIn, LogOut, User, Settings, Menu, X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

const navItems: (NavItem & { protected?: boolean })[] = [
  {
    title: "Inicio",
    href: "/dashboard",
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
    title: "Clases",
    href: "/clases",
    icon: Calendar,
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => !item.protected || status === "authenticated"
  );

  const sidebarContent = (
    <>
      <div className="mb-10 px-4 flex items-center gap-4">
        <img src="/fitwe-icon.png" alt="FitWe Logo" className="h-20 w-20 object-contain" />
        <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          <span translate="no" className="notranslate">Fit<span className="text-primary">We</span></span>
        </span>
      </div>
      <nav className="flex-1 space-y-2 mt-6 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
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
            <Link onClick={() => setIsMobileOpen(false)} href="/perfil" className="flex items-center gap-3 px-4 py-2 mx-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 overflow-hidden">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {session.user?.name || "Usuario"}
                </span>
              </div>
            </Link>
            <div className="space-y-1 pb-4 md:pb-0">

              {session.user.role === "USER" && (
                <Link
                  onClick={() => setIsMobileOpen(false)}
                  href="/dashboard/pago"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/pago")
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <CreditCard className="h-5 w-5" />
                  Mi Cuota
                </Link>
              )}
              <Link
                onClick={() => setIsMobileOpen(false)}
                href="/configuracion"
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  pathname.startsWith("/configuracion")
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Settings className="h-5 w-5" />
                Configuración
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <Link
            onClick={() => setIsMobileOpen(false)}
            href="/login"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
          >
            <LogIn className="h-5 w-5" />
            Iniciar Sesión
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 w-full px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40 items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/fitwe-icon.png" alt="FitWe" className="h-7 w-7 object-contain" />
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
            <span translate="no" className="notranslate">Fit<span className="text-primary">We</span></span>
          </span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: sticky, Mobile: slide-in overlay */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-[100dvh] w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-50 transition-transform duration-300 ease-in-out flex px-4 py-6 shadow-2xl md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
