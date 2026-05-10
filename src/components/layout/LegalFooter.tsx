"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function LegalFooter() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", body: "" });

  const openModal = (title: string) => {
    setModalContent({
      title,
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Este es un texto legal genérico simulado sobre cumplimiento de la RGPD y LOPD para probar el funcionamiento del modal. En producción, aquí iría el texto legal definitivo del centro deportivo o de la plataforma FitWe.",
    });
    setModalOpen(true);
  };

  return (
    <>
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} <span translate="no" className="notranslate">FitWe</span>. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => openModal("Aviso Legal")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Aviso Legal
            </button>
            <button
              onClick={() => openModal("Política de Privacidad")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Política de Privacidad
            </button>
            <button
              onClick={() => openModal("Términos y Condiciones")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Términos y Condiciones
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Legal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              {modalContent.title}
            </h3>
            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto pr-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>{modalContent.body}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
