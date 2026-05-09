"use client";

import { useState, useEffect } from "react";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function AccountConfigPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [passwords, setPasswords] = useState({ current: "", newPass: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    fetchPrivacy();
  }, []);

  const fetchPrivacy = async () => {
    try {
      const res = await fetch("/api/settings/privacy");
      if (res.ok) {
        const data = await res.json();
        setIsPrivate(data.isPrivate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyChange = async (checked: boolean) => {
    setIsPrivate(checked);
    setIsSavingPrivacy(true);
    try {
      await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: checked })
      });
    } catch (e) {
      console.error(e);
      setIsPrivate(!checked); // revert
    } finally {
      setIsSavingPrivacy(false);
    }
  };

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
        alert("Contraseña actualizada correctamente");
        setPasswords({ current: "", newPass: "" });
      } else {
        alert(data.message || "Error al cambiar contraseña");
      }
    } catch (e) {
      alert("Error interno");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ ADVERTENCIA EXTREMA ⚠️\n\n¿Estás absolutamente seguro de querer eliminar tu cuenta? Se borrarán TODOS tus entrenamientos, rutinas e historial para siempre.")) return;
    if (!window.confirm("¿Última confirmación? Esta acción NO se puede deshacer.")) return;

    try {
      const res = await fetch("/api/settings/delete-account", { method: "POST" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        alert("Error al eliminar la cuenta");
      }
    } catch (e) {
      alert("Error interno");
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cuenta y Seguridad</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Gestiona la privacidad y seguridad de tu cuenta.
      </p>

      {/* Privacidad */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Perfil Privado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Solo tú podrás ver tus rutinas y entrenamientos. No aparecerás en resultados sociales.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={isPrivate} onChange={(e) => handlePrivacyChange(e.target.checked)} disabled={isSavingPrivacy} />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 disabled:opacity-50"></div>
        </label>
      </div>

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
              onChange={e => setPasswords({...passwords, current: e.target.value})}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              required
              value={passwords.newPass}
              onChange={e => setPasswords({...passwords, newPass: e.target.value})}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={isChangingPass}
            className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 px-5 py-2 rounded-lg font-medium transition-colors"
          >
            {isChangingPass ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>

      {/* Eliminar Cuenta */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-2xl p-6 bg-red-50 dark:bg-red-950/20">
        <h3 className="font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Zona de Peligro
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400 mt-2 mb-4">
          Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
        </p>
        <button 
          onClick={handleDeleteAccount}
          className="text-red-600 hover:text-red-700 font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg transition-colors"
        >
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
}
