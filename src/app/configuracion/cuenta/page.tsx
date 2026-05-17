"use client";

import { useState, useEffect } from "react";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

export default function AccountConfigPage() {
  const { data: session } = useSession();
  const { showConfirm, showAlert } = useCustomAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [passwords, setPasswords] = useState({ current: "", newPass: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("Contraseña actualizada correctamente");
        setPasswords({ current: "", newPass: "" });
      } else {
        showAlert(data.message || "Error al cambiar contraseña");
      }
    } catch (e) {
      showAlert("Error interno");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      "ADVERTENCIA EXTREMA\n\n¿Estás absolutamente seguro de querer eliminar tu cuenta? Se borrarán TODOS tus entrenamientos, rutinas e historial para siempre.",
      () => {
        showConfirm("¿Última confirmación? Esta acción NO se puede deshacer.", async () => {
          try {
            const res = await fetch("/api/settings/delete-account", { method: "POST" });
            if (res.ok) {
              signOut({ callbackUrl: "/" });
            } else {
              showAlert("Error al eliminar la cuenta");
            }
          } catch (e) {
            showAlert("Error interno");
          }
        });
      }
    );
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cuenta y Seguridad</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Gestiona la seguridad de tu cuenta.
      </p>

      {/* Cambiar Contraseña */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Cambiar Contraseña
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña Actual</label>
            <input
              type="password"
              required
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              value={passwords.newPass}
              onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-cyan-500/20 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPass}
            className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 px-5 py-2 rounded-2xl font-medium transition-colors"
          >
            {isChangingPass ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>

      {/* Eliminar Cuenta */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-2xl p-6 bg-red-50 dark:bg-red-950/20">
        <h3 className="font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400 mt-2 mb-4">
          Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="text-red-600 hover:text-red-700 font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-6 py-3 rounded-full transition-colors"
        >
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
}
