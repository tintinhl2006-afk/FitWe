"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, Check, Save } from "lucide-react";
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

export default function LanguageConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState("es");
  const [currentLang, setCurrentLang] = useState("es");

  useEffect(() => {
    const match = document.cookie.match(/fitwe_lang=([^;]+)/);
    if (match) {
      setSelectedLang(match[1]);
      setCurrentLang(match[1]);
    }
    setIsLoading(false);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
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
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Idioma</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Selecciona el idioma de la interfaz. Los cambios se aplicarán al guardar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-3xl border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-cyan-50/60 dark:bg-primary/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 bg-white dark:bg-slate-900"
              )}
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <span className="flex-1 font-medium text-slate-900 dark:text-white text-sm">
                {lang.label}
              </span>
              {isSelected && (
                <Check className="h-5 w-5 text-primary dark:text-cyan-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Traducción por Google Translate
        </p>
        <button 
          onClick={handleSave}
          disabled={isSaving || selectedLang === currentLang}
          className="flex items-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-medium transition-colors"
        >
          <span className="flex items-center justify-center w-4 h-4">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </span>
          <span>Guardar cambios</span>
        </button>
      </div>
    </div>
  );
}
