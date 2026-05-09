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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  createdAt: string;
  totalWorkouts: number;
  recentSessions: SessionData[];
  routines: RoutineData[];
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const router = useRouter();
  const { clientId } = use(params);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/admin-gym/clients/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        } else if (res.status === 404 || res.status === 403) {
          setNotFound(true);
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
    fetchClient();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin-gym/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
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

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin-gym/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>
        <Link
          href={`/admin-gym/clientes/${clientId}/rutina/nueva`}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Asignar Nueva Rutina
        </Link>
      </div>

      {/* ── Client Header Card ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-lg">
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {client.name}
              </h1>
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
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 border border-indigo-100 dark:border-indigo-900/50">
              <Dumbbell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {client.totalWorkouts} entrenamientos
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-100 dark:border-slate-700">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {client.routines.length} rutina{client.routines.length !== 1 && "s"}
              </span>
            </div>
            {client.weight && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-100 dark:border-slate-700">
                <Weight className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {client.weight} kg
                </span>
              </div>
            )}
            {client.height && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-100 dark:border-slate-700">
                <Ruler className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {client.height} cm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Block 1: Recent Activity */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
            <Activity className="h-4 w-4 text-indigo-500" />
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
    </div>
  );
}
