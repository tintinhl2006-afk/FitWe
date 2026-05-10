"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeConfigPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Apariencia</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Cambia el aspecto visual de la aplicación.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tema Claro */}
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
            theme === "light" 
              ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <Sun className="h-6 w-6 text-orange-600" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Claro</span>
        </button>

        {/* Tema Oscuro */}
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
            theme === "dark" 
              ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Moon className="h-6 w-6 text-slate-300" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Oscuro</span>
        </button>

        {/* Sistema */}
        <button
          onClick={() => setTheme("system")}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all",
            theme === "system" 
              ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300"
          )}
        >
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Laptop className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Sistema</span>
        </button>
      </div>
    </div>
  );
}
