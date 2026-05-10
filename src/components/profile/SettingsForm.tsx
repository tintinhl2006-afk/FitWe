"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, CheckCircle2, AlertCircle, User, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    role?: string;
    monthlyFee?: number;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [newPassword, setNewPassword] = useState("");
  const [monthlyFee, setMonthlyFee] = useState(user.monthlyFee?.toString() || "49.99");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const body: Record<string, string> = { name: name.trim() };
      if (newPassword.length > 0) {
        body.newPassword = newPassword;
      }
      if (user.role === "GYM") {
        body.monthlyFee = monthlyFee;
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

      // Sync the session data with NextAuth
      const updatePayload: any = { name: name.trim() };
      if (user.role === "GYM") {
        updatePayload.monthlyFee = parseFloat(monthlyFee);
      }
      await update(updatePayload);

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
            Nombre
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

        {/* Monthly Fee field (only for GYM) */}
        {user.role === "GYM" && (
          <div>
            <label htmlFor="settings-fee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Precio de Cuota Mensual Estándar (€)
            </label>
            <div className="relative">
              <input
                id="settings-fee"
                type="number"
                step="0.01"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                required
                className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-4 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all sm:text-sm"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
              Este es el precio que se registrará automáticamente cuando renueves a un cliente B2B.
            </p>
          </div>
        )}

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
