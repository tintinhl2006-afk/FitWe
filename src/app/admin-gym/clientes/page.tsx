"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Loader2,
  User,
  Dumbbell,
  Mail,
  CalendarDays,
  UserPlus,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  totalWorkouts: number;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  plan: { id: string; name: string; price: number; durationDays: number } | null;
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin-gym/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin-gym/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.status === 201) {
        const newClient = await res.json();
        // Add to local state instantly
        setClients((prev) => [newClient, ...prev]);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", password: "" });
        setToast({ message: `Cliente "${newClient.name}" creado correctamente`, type: "success" });
      } else {
        const data = await res.json();
        setFormError(data.message || "Error al crear el cliente");
      }
    } catch (error) {
      setFormError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setFormData({ name: "", email: "", password: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-3xl px-5 py-3.5 shadow-2xl text-sm font-semibold animate-in slide-in-from-top-4 fade-in duration-300 border",
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-primary dark:text-cyan-400" />
            Gestión de Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {clients.length} cliente{clients.length !== 1 && "s"} registrado
            {clients.length !== 1 && "s"} en tu gimnasio
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Añadir Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Client Table / List */}
      {filtered.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <div className="col-span-4">Cliente</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-2 text-center">Tarifa</div>
            <div className="col-span-2 text-center">Desde</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/admin-gym/clientes/${client.id}`)}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                {/* Avatar + Name */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                    {client.image ? (
                      <img
                        src={client.image}
                        alt={client.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500 sm:hidden">
                      {client.email}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="hidden sm:flex col-span-2 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>

                {/* Status Badge */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    client.subscriptionStatus === "ACTIVE" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                      : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50"
                  )}>
                    {client.subscriptionStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Plan Info */}
                <div className="col-span-2 flex items-center justify-center">
                  {client.plan ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 px-2.5 py-0.5 text-xs font-bold text-primary dark:text-cyan-400">
                      {client.plan.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin tarifa</span>
                  )}
                </div>

                {/* Joined Date */}
                <div className="hidden sm:flex col-span-2 items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(client.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-700" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Sin resultados
              </h3>
              <p className="text-slate-500 max-w-sm">
                No se encontraron clientes que coincidan con &quot;{searchQuery}&quot;.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Aún no tienes clientes
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                Añade a tus clientes para que se unan a tu gimnasio y empieza
                a gestionar sus entrenamientos.
              </p>
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Añadir primer cliente
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Modal: Añadir Cliente ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-6 duration-300 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Nuevo Cliente
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Crea una cuenta para tu cliente
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClient} className="px-7 py-6 space-y-5">
              {/* Error Message */}
              {formError && (
                <div className="flex items-center gap-2 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña provisional
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  El cliente podrá cambiarla más tarde desde su perfil.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-3xl px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-70 transition-colors active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
