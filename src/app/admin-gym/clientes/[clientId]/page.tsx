"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  CalendarDays,
  Dumbbell,
  Clock,
  Activity,
  AlertTriangle,
  Ruler,
  Weight,
  Plus,
  CreditCard,
  Edit,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface SessionData {
  id: string;
  routineName: string;
  date: string;
  durationMinutes: number;
}

interface RoutineData {
  id: string;
  name: string;
  createdAt: string;
  exerciseCount: number;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  image: string | null;
  weight: number | null;
  height: number | null;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  createdAt: string;
  totalWorkouts: number;
  recentSessions: SessionData[];
  routines: RoutineData[];
  serverNow: string;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const router = useRouter();
  const { clientId } = use(params);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [exactDate, setExactDate] = useState("");

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        if (data.subscriptionEndDate) {
          setExactDate(new Date(data.subscriptionEndDate).toISOString().split('T')[0]);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}/subscription`);
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (e) {
      console.error("Error fetching payments:", e);
    }
  };

  useEffect(() => {
    fetchClient();
    fetchPayments();
  }, [clientId]);

  const handleSubscriptionUpdate = async (status?: string, addDays?: number, exactEndDate?: string) => {
    if (addDays && !window.confirm(`¿Seguro que quieres extender la suscripción de ${client?.name} por ${addDays} días?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, addDays, exactEndDate }),
      });
      if (res.ok) {
        setIsDateModalOpen(false);
        fetchClient();
        fetchPayments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin-gym/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Cliente no encontrado
          </h3>
          <p className="text-slate-500 max-w-sm">
            Este cliente no existe o no pertenece a tu gimnasio.
          </p>
        </div>
      </div>
    );
  }

  const memberSince = new Date(client.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subEndDate = client.subscriptionEndDate 
    ? new Date(client.subscriptionEndDate) 
    : null;
  
  const nowReference = new Date(client.serverNow);
  const isExpired = subEndDate && subEndDate < nowReference;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin-gym/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>
        <Link
          href={`/admin-gym/clientes/${clientId}/rutina/nueva`}
          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Asignar Nueva Rutina
        </Link>
      </div>

      {/* ── Client Header Card ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 pb-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-soft">
              {client.image ? (
                <img
                  src={client.image}
                  alt={client.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-slate-400 dark:text-slate-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {client.name}
                </h1>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  client.subscriptionStatus === "ACTIVE" && !isExpired
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                    : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"
                )}>
                  {client.subscriptionStatus === "ACTIVE" ? (isExpired ? "Expirado" : "Activo") : "Inactivo"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Miembro desde {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 px-4 py-2 border border-cyan-100 dark:border-cyan-900/50">
              <Dumbbell className="h-4 w-4 text-primary dark:text-cyan-400" />
              <span className="text-sm font-bold text-primary dark:text-cyan-300">
                {client.totalWorkouts} entrenamientos
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-3xl bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-100 dark:border-slate-700">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {client.routines.length} rutina{client.routines.length !== 1 && "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscriptions Management ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Gestión de Cuota y Suscripción
            </h2>
          </div>
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <div className="p-6 space-y-8">
          {/* Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                disabled={isUpdating}
                onClick={() => handleSubscriptionUpdate(client.subscriptionStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                className={cn(
                  "px-6 py-3 rounded-3xl text-sm font-bold transition-all shadow-sm active:scale-95",
                  client.subscriptionStatus === "ACTIVE"
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 dark:shadow-none"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none"
                )}
              >
                {client.subscriptionStatus === "ACTIVE" ? "Desactivar Acceso" : "Activar Acceso (+30 días)"}
              </button>
              <div className="text-sm">
                <p className="font-bold dark:text-white flex items-center gap-2">
                  {client.subscriptionStatus === "ACTIVE" && !isExpired ? (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                  {client.subscriptionStatus === "ACTIVE" ? (isExpired ? "Suscripción Expirada" : "Suscripción Activa") : "Acceso Desactivado"}
                </p>
                <p className="text-slate-500 text-xs">
                  {client.subscriptionStatus === "ACTIVE" && !isExpired ? "El usuario puede acceder a todas las funciones." : "El usuario tiene el acceso restringido."}
                </p>
              </div>
            </div>

            <button
              disabled={isUpdating}
              onClick={() => handleSubscriptionUpdate(undefined, 30)}
              className="flex items-center gap-2 rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400 px-6 py-3 text-sm font-bold hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors border border-cyan-100 dark:border-cyan-900/50"
            >
              Extender +30 Días
            </button>
          </div>

          {/* Dates Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fecha de Alta</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date(client.createdAt).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-3xl",
                  isExpired ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-cyan-50 dark:bg-cyan-950/30 text-primary"
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fin de Suscripción</p>
                  <p className={cn("text-sm font-bold", isExpired ? "text-red-600" : "text-slate-900 dark:text-white")}>
                    {subEndDate ? subEndDate.toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' }) : "Pendiente de activación"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDateModalOpen(true)}
                className="p-2 text-slate-400 hover:text-primary transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment History ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Historial de Pagos y Ajustes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {p.description}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {p.amount > 0 ? `${p.amount}€` : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                    No hay registros de pagos para este cliente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Block 1: Recent Activity */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Actividad Reciente
            </h2>
          </div>

          {client.recentSessions.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {client.recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin-gym/clientes/${clientId}/sesiones/${s.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
                        {s.routineName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(s.date).toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {s.durationMinutes} min
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <Dumbbell className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Este cliente aún no ha registrado entrenamientos.
              </p>
            </div>
          )}
        </div>

        {/* Block 2: Routines */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Rutinas del Cliente
            </h2>
          </div>

          {client.routines.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {client.routines.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {r.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                      Creada el{" "}
                      {new Date(r.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {r.exerciseCount} ejercicio{r.exerciseCount !== 1 && "s"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <Activity className="h-10 w-10 text-slate-200 dark:text-slate-800 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Este cliente no tiene rutinas creadas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Date Edit Modal ── */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Fecha de Expiración</h3>
              <button onClick={() => setIsDateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Fecha de Caducidad
                </label>
                <input
                  type="date"
                  value={exactDate}
                  onChange={(e) => setExactDate(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none sm:text-sm"
                />
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDateModalOpen(false)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSubscriptionUpdate(undefined, undefined, exactDate)}
                  disabled={isUpdating || !exactDate}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-70 transition-colors"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
