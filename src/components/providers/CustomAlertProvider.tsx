"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, HelpCircle } from "lucide-react";

interface AlertContextType {
  showAlert: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    isConfirm: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    message: "",
    isConfirm: false,
  });

  useEffect(() => {
    // Intercept native window.alert
    const nativeAlert = window.alert;
    window.alert = (message: any) => {
      setAlertState({
        isOpen: true,
        message: String(message),
        isConfirm: false,
      });
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  const showAlert = (message: string) => {
    setAlertState({
      isOpen: true,
      message,
      isConfirm: false,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setAlertState({
      isOpen: true,
      message,
      isConfirm: true,
      onConfirm,
      onCancel,
    });
  };

  const handleConfirm = () => {
    if (alertState.onConfirm) alertState.onConfirm();
    setAlertState({ isOpen: false, message: "", isConfirm: false });
  };

  const handleCancel = () => {
    if (alertState.onCancel) alertState.onCancel();
    setAlertState({ isOpen: false, message: "", isConfirm: false });
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (alertState.isConfirm) {
          handleConfirm();
        } else {
          setAlertState({ isOpen: false, message: "", isConfirm: false });
        }
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };

    if (alertState.isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [alertState.isOpen, alertState.isConfirm, alertState.onConfirm, alertState.onCancel]);

  // Determine alert type based on message keywords
  const getAlertType = () => {
    if (alertState.isConfirm) {
      return {
        type: "confirm",
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",
        icon: <HelpCircle className="w-8 h-8 text-amber-500 animate-pulse" />,
        title: "Confirmar acción",
      };
    }

    const msg = alertState.message.toLowerCase();
    if (
      msg.includes("correcto") ||
      msg.includes("éxito") ||
      msg.includes("actualizad") ||
      msg.includes("guardad") ||
      msg.includes("cread")
    ) {
      return {
        type: "success",
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40",
        icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
        title: "¡Acción Completada!",
      };
    }
    if (
      msg.includes("error") ||
      msg.includes("falló") ||
      msg.includes("permiso") ||
      msg.includes("grande") ||
      msg.includes("máximo") ||
      msg.includes("no se") ||
      msg.includes("ya está")
    ) {
      return {
        type: "error",
        color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40",
        icon: <AlertCircle className="w-8 h-8 text-rose-500" />,
        title: "Ha ocurrido un problema",
      };
    }
    return {
      type: "info",
      color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/40",
      icon: <Info className="w-8 h-8 text-cyan-500" />,
      title: "Notificación",
    };
  };

  const alertConfig = getAlertType();

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-scale-up">
            {/* Accent Color Band */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${alertConfig.color.split(" ")[1]}`}>
                {alertConfig.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {alertConfig.title}
              </h3>
            </div>

            {/* Message Body */}
            <div className="p-6 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium whitespace-pre-line">
                {alertState.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/50 flex justify-center gap-3">
              {alertState.isConfirm ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-sm shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Aceptar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancel}
                  className="px-8 py-2.5 bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary/90 text-white font-bold rounded-2xl text-sm shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useCustomAlert debe usarse dentro de un CustomAlertProvider");
  }
  return context;
}
