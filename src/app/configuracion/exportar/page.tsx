"use client";

import { Download, FileSpreadsheet } from "lucide-react";

export default function ExportDataPage() {
  const handleExport = () => {
    window.location.href = "/api/export/csv";
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Exportar datos</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Descarga todo tu historial de entrenamiento en formato CSV para analizarlo en Excel, Google Sheets o cualquier otra herramienta.
      </p>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">Historial Completo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Incluye todas tus sesiones completadas con el desglose de ejercicios, series, peso levantado y repeticiones.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar en CSV
          </button>
        </div>
      </div>
    </div>
  );
}
