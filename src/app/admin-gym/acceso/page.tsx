"use client";

import { useState, useEffect, useRef } from "react";
import { 
  QrCode, 
  User, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  History,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationResult {
  status: "GRANTED" | "DENIED";
  message: string;
  reason?: string;
  client?: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
    planName: string;
    subscriptionEndDate?: string | null;
    creditsRemaining?: number | null;
  };
}

interface ScanLogItem {
  id: string;
  name: string;
  email: string;
  status: "GRANTED" | "DENIED";
  time: string;
  message: string;
}

export default function AccessControlPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [history, setHistory] = useState<ScanLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [scanMode, setScanMode] = useState<"entry" | "exit">("entry");
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;

  const scannerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  // Inicializar AudioContext de forma diferida tras interacción
  const playSound = (type: "success" | "failure") => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "success") {
        // Sonido de éxito (Dos tonos ascendentes cortos)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        
        // Primer tono
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.start();
        
        // Segundo tono
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Sonido de fallo (Tono bajo y áspero)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sawtooth";
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.frequency.setValueAtTime(120, ctx.currentTime); // Tono bajo 120Hz
        osc.start();
        
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("No se pudo reproducir el sonido de acceso:", e);
    }
  };

  // Procesar validación de código con el servidor
  const processCheckIn = async (payload: { token?: string; manualInput?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-gym/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type: scanModeRef.current }),
      });

      if (!res.ok) {
        throw new Error("Error en la conexión con el servidor.");
      }

      const data: ValidationResult = await res.json();
      setResult(data);

      // Reproducir sonido de retroalimentación inmediato
      if (data.status === "GRANTED") {
        playSound("success");
      } else {
        playSound("failure");
      }

      // Añadir al registro de historial de la sesión
      const clientName = data.client?.name || payload.manualInput || "Usuario Desconocido";
      const clientEmail = data.client?.email || "";
      
      setHistory(prev => [
        {
          id: Math.random().toString(),
          name: clientName,
          email: clientEmail,
          status: data.status,
          message: data.message,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
        ...prev.slice(0, 19), // Limitar a las últimas 20 entradas en memoria
      ]);

    } catch (err: any) {
      setError(err.message || "Error al procesar el acceso.");
      playSound("failure");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar sugerencias de clientes por búsqueda de nombre
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin-gym/access/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } catch (e) {
        console.error("Error al buscar sugerencias de clientes:", e);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Configurar e inicializar scanner HTML5 QR con solicitud de permiso automático
  useEffect(() => {
    if (!cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e: any) => console.error("Error al limpiar:", e));
        scannerRef.current = null;
      }
      return;
    }

    let isScanning = true;

    // Cargar dinámicamente para prevenir Next.js SSR crashes
    import("html5-qrcode").then((module) => {
      if (!isScanning) return;

      const Html5Qrcode = module.Html5Qrcode;
      const scanner = new Html5Qrcode("qr-reader-container");
      
      scanner.start(
        { facingMode: "environment" },
        {
          fps: 15, // Aumentar fotogramas por segundo para una detección hiperveloz
          aspectRatio: 1.0,
          // Omitimos 'qrbox' para activar el escaneo de Pantalla Completa (Full Frame).
          // Esto permite que el QR sea decodificado en cualquier parte del visor
          // sin necesidad de encuadrarlo perfectamente, haciéndolo extremadamente flexible.
        },
        (decodedText) => {
          // Evitar lecturas duplicadas mientras se procesa
          if (isLoading) return;

          const now = Date.now();
          // Si es el mismo código QR y ha pasado menos de 5 segundos, ignorarlo
          // para evitar spam de llamadas de red y pitidos repetidos
          if (
            decodedText === lastScannedTokenRef.current &&
            now - lastScanTimestampRef.current < 5000
          ) {
            return;
          }

          // Actualizar registros de prevención de doble escaneo
          lastScannedTokenRef.current = decodedText;
          lastScanTimestampRef.current = now;

          processCheckIn({ token: decodedText });
        },
        (errorMessage) => {
          // Silenciar errores ordinarios de escaneo
        }
      ).catch((err) => {
        console.error("No se pudo iniciar la cámara en vivo:", err);
        setError("No se pudo iniciar la cámara. Por favor, asegúrese de otorgar permisos de cámara en su navegador.");
      });

      scannerRef.current = scanner;
    }).catch((err) => {
      console.error("No se pudo iniciar el lector QR:", err);
      setError("No se pudo inicializar la cámara. Por favor compruebe los permisos.");
    });

    return () => {
      isScanning = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e: any) => console.error("Error en cleanup:", e));
        scannerRef.current = null;
      }
    };
  }, [cameraActive]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <QrCode className="h-7 w-7 text-primary dark:text-cyan-400" />
            Control de Acceso
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Valide los accesos de clientes mediante escaneo de código QR o búsqueda manual.
          </p>
        </div>

        {/* Selector Entrada/Salida — aplica tanto a la cámara como a la búsqueda manual */}
        <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shrink-0 shadow-sm">
          <button
            onClick={() => setScanMode("entry")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              scanMode === "entry"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Entrada
          </button>
          <button
            onClick={() => setScanMode("exit")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              scanMode === "exit"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Salida
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Izquierdo: Scanner & Manual Input (Cols: 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Lector QR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-500" /> Cámara del Lector
              </h2>
              
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer transition-all",
                  cameraActive 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                )}
              >
                {cameraActive ? "Encendida" : "Apagada"}
              </button>
            </div>

            {cameraActive ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                {/* Lector QR central */}
                <div id="qr-reader-container" className="w-full h-full" />
                
                {/* Máscara guía Sci-Fi en React (Visual y no restrictiva) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  {/* Sombreado periférico */}
                  <div className="absolute inset-0 bg-slate-950/25" />
                  
                  {/* Cuadro de enfoque flotante */}
                  <div className="relative w-3/4 h-3/4 max-w-[260px] max-h-[260px] border border-cyan-500/20 rounded-3xl flex items-center justify-center">
                    {/* Esquinas cian brillantes */}
                    <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl -mt-[3px] -ml-[3px] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                    <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl -mt-[3px] -mr-[3px] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                    <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl -mb-[3px] -ml-[3px] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                    <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-xl -mb-[3px] -mr-[3px] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                    
                    {/* Línea láser de escaneo animada */}
                    <span className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-scan-laser" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-900 text-slate-600 p-8 text-center">
                <ShieldAlert className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-xs font-bold text-slate-400">Cámara Inactiva</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Active la cámara desde el control superior para iniciar el escaneo en vivo.</p>
              </div>
            )}
          </div>

          {/* Búsqueda Manual */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan-500" /> Búsqueda Manual
            </h2>

            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba el nombre completo del cliente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <User className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              {/* Autocomplete Dropdown List */}
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-100">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
                      No se encontraron resultados
                    </div>
                  ) : (
                    suggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          processCheckIn({ manualInput: client.id });
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                          {client.image ? (
                            <img src={client.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{client.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{client.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Lado Derecho: Estado de Acceso & Historial (Cols: 7) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col min-h-0">
          
          {/* Card Gigante de Validación */}
          <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[360px]">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-500" /> Panel de Validación Instantáneo
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {isLoading ? (
                <div className="flex flex-col items-center animate-pulse">
                  <Loader2 className="h-16 w-16 text-primary dark:text-cyan-400 animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Verificando firma criptográfica...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center text-center max-w-sm">
                  <AlertTriangle className="h-14 w-14 text-amber-500 mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Error de Conexión</h3>
                  <p className="text-xs text-slate-500 mt-2">{error}</p>
                </div>
              ) : !result ? (
                <div className="flex flex-col items-center text-center text-slate-400 max-w-xs py-10">
                  <QrCode className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-4 stroke-1 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">Esperando Escaneo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-550 mt-2 leading-relaxed">
                    Aproxime el código QR de un cliente a la cámara o busque manualmente para validar su pase.
                  </p>
                </div>
              ) : result.status === "GRANTED" ? (
                // ACCESO PERMITIDO (GIGANTE VERDE PREMIUM)
                <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
                  
                  {/* Animación de pulso verde */}
                  <div className="relative flex items-center justify-center mb-6">
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-emerald-400/20 animate-ping duration-1000" />
                    <div className="relative h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide leading-none">
                    Acceso Autorizado
                  </h3>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                    {result.message}
                  </p>

                  {/* Ficha del Cliente */}
                  <div className="w-full max-w-md bg-slate-50 dark:bg-slate-950/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-900 mt-6 flex gap-4 items-center text-left">
                    <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {result.client?.image ? (
                        <img src={result.client.image} alt="Client" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-snug">{result.client?.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{result.client?.email}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-150 dark:bg-cyan-900/30 text-primary dark:text-cyan-400 px-2 py-0.5 rounded-md">
                          Plan: {result.client?.planName}
                        </span>
                        {result.client?.subscriptionEndDate && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">
                            Vence: {new Date(result.client.subscriptionEndDate).toLocaleDateString("es-ES")}
                          </span>
                        )}
                        {result.client?.creditsRemaining !== undefined && result.client?.creditsRemaining !== null && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-900/30 text-primary dark:text-cyan-400 px-2 py-0.5 rounded-md">
                            {result.client.creditsRemaining} créditos restantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                // ACCESO DENEGADO (GIGANTE ROJO PREMIUM)
                <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
                  
                  {/* Animación de pulso rojo */}
                  <div className="relative flex items-center justify-center mb-6">
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-400/20 animate-ping duration-1000" />
                    <div className="relative h-20 w-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                      <XCircle className="h-10 w-10" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-red-500 uppercase tracking-wide leading-none">
                    Acceso Denegado
                  </h3>
                  
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2.5 bg-red-50 dark:bg-red-950/20 px-3.5 py-1.5 rounded-full border border-red-100 dark:border-red-800 max-w-sm">
                    {result.message}
                  </p>

                  {/* Ficha del Cliente (Si existe) */}
                  {result.client && (
                    <div className="w-full max-w-md bg-red-50/20 dark:bg-red-950/5 rounded-3xl p-5 border border-red-100/30 dark:border-red-950/20 mt-6 flex gap-4 items-center text-left opacity-80">
                      <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {result.client.image ? (
                          <img src={result.client.image} alt="Client" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-snug">{result.client.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{result.client.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                            Plan: {result.client.planName}
                          </span>
                          {result.client.creditsRemaining !== undefined && result.client.creditsRemaining !== null && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                              {result.client.creditsRemaining} créditos restantes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Acciones Rápidas */}
            {result && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => setResult(null)}
                  className="px-5 py-2.5 rounded-3xl text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
                >
                  Limpiar Pantalla
                </button>
              </div>
            )}
          </div>

          {/* Historial Corto del Scanner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-[200px] flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-500" /> Registro Reciente de Accesos
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-600 italic">
                  No se han registrado accesos en esta sesión.
                </div>
              ) : (
                history.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900/80 animate-in slide-in-from-top-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {log.status === "GRANTED" ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/10 shrink-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/10 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{log.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{log.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                        log.status === "GRANTED"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400"
                      )}>
                        {log.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Estilos globales y animación del láser de escaneo */}
      <style>{`
        #qr-reader-container video {
          border-radius: 16px !important;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader-container canvas {
          display: none !important; /* Ocultar canvas internos por defecto de html5-qrcode */
        }
        @keyframes scan-laser-move {
          0% { top: 12%; opacity: 0.2; }
          15% { opacity: 0.9; }
          50% { top: 88%; opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { top: 12%; opacity: 0.2; }
        }
        .animate-scan-laser {
          position: absolute;
          animation: scan-laser-move 3.5s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
