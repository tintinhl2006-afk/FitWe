"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSession } from "next-auth/react";
import { AlertTriangle, Settings } from "lucide-react";
import Link from "next/link";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const serverNow = session?.user?.serverNow ? new Date(session.user.serverNow) : new Date();
  
  // Si la diferencia entre la hora del servidor (mockeada o real) y la local es mayor a 5 minutos, asumimos que está simulado
  const isMocked = Math.abs(serverNow.getTime() - Date.now()) > 5 * 60 * 1000;

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-[100dvh] min-w-0 max-w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
          {isMocked && (
            <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-[100] shadow-soft animate-in slide-in-from-top duration-300">
              <AlertTriangle className="h-4 w-4" />
              MODO TESTING ACTIVO: El tiempo está simulado ({serverNow.toLocaleString('es-ES')})
            </div>
          )}
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-10 md:pb-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
