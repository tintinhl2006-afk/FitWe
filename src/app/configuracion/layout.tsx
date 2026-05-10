"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Lock, Settings, Globe, Moon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const configMenu = [
  {
    title: "CUENTA",
    items: [
      { name: "Perfil", href: "/configuracion/perfil", icon: User },
      { name: "Cuenta", href: "/configuracion/cuenta", icon: Lock },
    ],
  },
  {
    title: "PREFERENCIAS",
    items: [
      { name: "Unidades", href: "/configuracion/unidades", icon: Settings },
      { name: "Idioma", href: "/configuracion/idioma", icon: Globe },
      { name: "Tema", href: "/configuracion/tema", icon: Moon },
      { name: "Exportar datos", href: "/configuracion/exportar", icon: Download },
    ],
  },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Configuración</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-8">
              {configMenu.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || (pathname === '/configuracion' && item.href === '/configuracion/perfil');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-colors",
                            isActive
                              ? "bg-cyan-50 text-primary dark:bg-primary/10 dark:text-cyan-400"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-h-[500px]">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
