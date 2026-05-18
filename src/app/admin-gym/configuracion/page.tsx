"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Loader2, Settings, Globe, Moon, Sun, Laptop, Check, Save } from "lucide-react";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "es", label: "Español (España)" },
  { code: "en", label: "English (US)" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "zh-CN", label: "中文 (Simplificado)" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
];

function triggerGoogleTranslate(langCode: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo) {
    combo.value = langCode;
    combo.dispatchEvent(new Event("change"));
  }
}

function saveLangCookie(langCode: string) {
  document.cookie = `fitwe_lang=${langCode};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export default function GymSettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"general" | "idioma" | "tema">("general");
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Language state
  const [isLangLoading, setIsLangLoading] = useState(true);
  const [isLangSaving, setIsLangSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState("es");
  const [currentLang, setCurrentLang] = useState("es");

  useEffect(() => {
    setMounted(true);

    const match = document.cookie.match(/fitwe_lang=([^;]+)/);
    if (match) {
      setSelectedLang(match[1]);
      setCurrentLang(match[1]);
    }
    setIsLangLoading(false);
  }, []);

  const handleLangSave = async () => {
    setIsLangSaving(true);
    try {
      saveLangCookie(selectedLang);
      
      await fetch("/api/settings/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLang }),
      });

      if (selectedLang === "es") {
        document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "googtrans=;path=/;domain=." + window.location.hostname + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.reload();
      } else {
        triggerGoogleTranslate(selectedLang);
        setCurrentLang(selectedLang);
        alert("Idioma actualizado");
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar el idioma");
    } finally {
      setIsLangSaving(false);
    }
  };

  if (status === "loading" || (!mounted && activeTab === "tema")) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Configuración del Centro
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personaliza el idioma, la apariencia y actualiza los datos de tu centro deportivo.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "general"
              ? "border-primary text-primary dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("idioma")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "idioma"
              ? "border-primary text-primary dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Idioma
        </button>
        <button
          onClick={() => setActiveTab("tema")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "tema"
              ? "border-primary text-primary dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Tema
        </button>
      </div>

      {/* Tab Contents */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
        
        {/* Tab 1: General Settings */}
        {activeTab === "general" && (
          <SettingsForm
            user={{
              name: session?.user?.name || "",
              email: session?.user?.email || "",
              role: session?.user?.role,
            }}
          />
        )}

        {/* Tab 2: Language Settings */}
        {activeTab === "idioma" && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Idioma</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Selecciona el idioma de la interfaz del panel de administración.
            </p>

            {isLangLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {LANGUAGES.map((lang) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang.code)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-95",
                          isSelected
                            ? "border-primary bg-cyan-50/50 dark:bg-primary/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 bg-slate-50/50 dark:bg-slate-950/50"
                        )}
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                          <Globe className="h-5 w-5 text-slate-400" />
                        </div>
                        <span className="flex-1 font-semibold text-slate-900 dark:text-white text-sm">
                          {lang.label}
                        </span>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary dark:text-cyan-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Traducción por Google Translate
                  </p>
                  <button 
                    onClick={handleLangSave}
                    disabled={isLangSaving || selectedLang === currentLang}
                    className="flex items-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <span className="flex items-center justify-center w-4 h-4">
                      {isLangSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </span>
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Theme Settings */}
        {activeTab === "tema" && mounted && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tema y Apariencia</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Cambia el estilo visual del panel de administración del gimnasio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tema Claro */}
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95",
                  theme === "light" 
                    ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-cyan-300"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Claro</span>
              </button>

              {/* Tema Oscuro */}
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95",
                  theme === "dark" 
                    ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-cyan-300"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-slate-800 dark:bg-slate-900 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-slate-300 dark:text-slate-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Oscuro</span>
              </button>

              {/* Sistema */}
              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95",
                  theme === "system" 
                    ? "border-primary bg-cyan-50/50 dark:bg-primary/10" 
                    : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-cyan-300"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <Laptop className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Sistema</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
