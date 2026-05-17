"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  Tag,
  Clock,
  Users,
  Euro,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  isActive: boolean;
  _count: { users: number };
}

export default function GymPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    durationDays: "30",
    description: "",
  });

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin-gym/plans");
      if (res.ok) setPlans(await res.json());
    } catch (e) {
      console.error("Error fetching plans:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin-gym/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear el plan");

      setIsModalOpen(false);
      setFormData({ name: "", price: "", durationDays: "30", description: "" });
      setSuccess("Tarifa creada correctamente");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta tarifa?")) return;

    try {
      const res = await fetch(`/api/admin-gym/plans/${planId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setSuccess(data.message);
      setTimeout(() => setSuccess(""), 3000);
      await fetchPlans();
    } catch (e) {
      console.error("Error deleting plan:", e);
    }
  };

  const formatDuration = (days: number) => {
    if (days === 1) return "1 día";
    if (days === 7) return "1 semana";
    if (days === 14) return "2 semanas";
    if (days === 30) return "1 mes";
    if (days === 60) return "2 meses";
    if (days === 90) return "3 meses";
    if (days === 180) return "6 meses";
    if (days === 365) return "1 año";
    return `${days} días`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Tarifas
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestiona los planes de suscripción de tu gimnasio.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setError("");
            }}
            className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarifa
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center px-6">
            <Tag className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Sin tarifas
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Crea tu primera tarifa para que tus clientes puedan pagar online.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm transition-all relative group",
                  plan.isActive
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"
                )}
              >
                {!plan.isActive && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Inactiva
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {plan.price.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">€</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {formatDuration(plan.durationDays)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4 text-slate-400" />
                    {plan._count.users}{" "}
                    {plan._count.users === 1 ? "cliente" : "clientes"}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Plan Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Nueva Tarifa
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre de la tarifa *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Precio (€) *
                    </label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-9 pr-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Duración *
                    </label>
                    <select
                      value={formData.durationDays}
                      onChange={(e) =>
                        setFormData({ ...formData, durationDays: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="7">1 Semana</option>
                      <option value="14">2 Semanas</option>
                      <option value="30">1 Mes</option>
                      <option value="60">2 Meses</option>
                      <option value="90">3 Meses</option>
                      <option value="180">6 Meses</option>
                      <option value="365">1 Año</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Descripción (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-70 transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Crear Tarifa"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
