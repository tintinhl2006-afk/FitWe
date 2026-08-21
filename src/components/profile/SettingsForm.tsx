"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { update } = useSession();

  const [name, setName] = useState(user.name);
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [gymCode, setGymCode] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        if (data.role === "GYM") {
          setGymCode(data.gymCode || "");
        }
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const body: Record<string, any> = { name: name.trim() };
      if (newPassword.length > 0) {
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al guardar");
      }

      // Sync NextAuth session
      await update({ name: name.trim() });

      setNewPassword("");
      showToast("success", data.message || "Cambios guardados correctamente");
    } catch (err: any) {
      showToast("error", err.message || "Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "absolute -top-4 left-0 right-0 mx-auto max-w-md rounded-3xl border px-4 py-3 text-sm font-medium shadow-soft transition-all animate-fade-in-up flex items-center gap-2 z-10",
            toast.type === "success"
              ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800 text-primary dark:text-cyan-300"
              : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        {/* Name field */}
        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nombre del Centro
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm"
            />
          </div>
        </div>

        {/* Email field (disabled) */}
        <div>
          <label htmlFor="settings-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-email"
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-slate-500 dark:text-slate-500 cursor-not-allowed sm:text-sm"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            El correo electrónico no se puede modificar por seguridad.
          </p>
        </div>

        {/* Código del Centro (Solo para GYM) */}
        {user.role === "GYM" && gymCode && (
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/10 p-5 space-y-2">
            <h4 className="text-xs font-bold text-primary dark:text-cyan-400 uppercase tracking-wider">
              Código de Vinculación de Socios
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Comparte este código con tus clientes. Lo necesitarán para crear su cuenta y quedar automáticamente vinculados a tu centro.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="font-mono text-xl font-black bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-slate-800 dark:text-white tracking-widest shadow-sm select-all">
                {gymCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(gymCode);
                  showToast("success", "¡Código copiado al portapapeles!");
                }}
                className="flex items-center gap-1 bg-primary hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Copiar Código
              </button>
            </div>
          </div>
        )}

        {/* New password field */}
        <div>
          <label htmlFor="settings-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nueva Contraseña <span className="text-slate-400 dark:text-slate-600 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              id="settings-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm"
              placeholder="Déjalo vacío para no cambiar"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            Mínimo 6 caracteres. Solo se actualiza si introduces una nueva.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-2 rounded-3xl bg-primary hover:bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-soft",
              isSaving && "opacity-60 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
