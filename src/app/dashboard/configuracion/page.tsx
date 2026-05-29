"use client";

import { useSession } from "next-auth/react";
import { Loader2, Settings } from "lucide-react";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function UserSettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Configuración del Perfil
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Actualiza tus datos personales y contraseña.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <SettingsForm
            user={{
              name: session?.user?.name || "",
              email: session?.user?.email || "",
              role: session?.user?.role,
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
