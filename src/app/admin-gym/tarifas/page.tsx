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
  Edit,
  CreditCard,
  RefreshCw,
  Infinity as InfinityIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

type BillingType = "DURATION" | "CREDITS";
type CreditRechargeMode = "PER_PAYMENT" | "PERIODIC";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  billingType: BillingType;
  creditsPerCycle: number | null;
  creditRechargeMode: CreditRechargeMode | null;
  rechargeIntervalDays: number | null;
  creditsNeverExpire: boolean;
  description: string | null;
  isActive: boolean;
  _count: { users: number };
}

const DURATION_SHORTCUTS = [
  { label: "1 semana", days: 7 },
  { label: "1 mes", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 año", days: 365 },
];

export default function GymPlansPage() {
  const { showConfirm, showAlert } = useCustomAlert();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const emptyFormData = {
    name: "",
    price: "",
    durationDays: "30",
    description: "",
    isActive: true,
    billingType: "DURATION" as BillingType,
    creditsPerCycle: "10",
    creditRechargeMode: "PER_PAYMENT" as CreditRechargeMode,
    rechargeIntervalDays: "30",
    creditsNeverExpire: false,
  };

  const [formData, setFormData] = useState(emptyFormData);

  const isCredits = formData.billingType === "CREDITS";
  const isPeriodic = isCredits && formData.creditRechargeMode === "PERIODIC";
  const durationHidden = isCredits && !isPeriodic && formData.creditsNeverExpire;
  const durationLabel = !isCredits
    ? "Duración *"
    : isPeriodic
    ? "Vigencia total del bono (días) *"
    : "Caducidad de los créditos (días) *";

  const handleEditClick = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      description: plan.description || "",
      isActive: plan.isActive,
      billingType: plan.billingType,
      creditsPerCycle: (plan.creditsPerCycle ?? 10).toString(),
      creditRechargeMode: plan.creditRechargeMode ?? "PER_PAYMENT",
      rechargeIntervalDays: (plan.rechargeIntervalDays ?? 30).toString(),
      creditsNeverExpire: plan.creditsNeverExpire,
    });
    setError("");
    setIsModalOpen(true);
  };

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
      const url = editingPlan 
        ? `/api/admin-gym/plans/${editingPlan.id}`
        : "/api/admin-gym/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: formData.price,
          durationDays: formData.durationDays,
          description: formData.description,
          isActive: formData.isActive,
          billingType: formData.billingType,
          ...(isCredits && {
            creditsPerCycle: formData.creditsPerCycle,
            creditRechargeMode: formData.creditRechargeMode,
            rechargeIntervalDays: formData.rechargeIntervalDays,
            creditsNeverExpire: formData.creditsNeverExpire,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error al ${editingPlan ? 'actualizar' : 'crear'} la tarifa`);

      setIsModalOpen(false);
      setFormData(emptyFormData);
      setEditingPlan(null);
      setSuccess(editingPlan ? "Tarifa actualizada correctamente" : "Tarifa creada correctamente");
      setTimeout(() => setSuccess(""), 3000);
      await fetchPlans();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (planId: string) => {
    showConfirm("¿Seguro que quieres eliminar esta tarifa?", async () => {
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
    });
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

  const totalPages = Math.max(1, Math.ceil(plans.length / PAGE_SIZE));
  const paginatedPlans = plans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Keep the current page within bounds if the plan list shrinks (e.g. after a delete)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

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
              setEditingPlan(null);
              setFormData(emptyFormData);
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
            {paginatedPlans.map((plan) => (
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
                  {plan.billingType === "CREDITS" ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        {plan.creditsPerCycle} créditos
                        {plan.creditRechargeMode === "PERIODIC"
                          ? ` cada ${plan.rechargeIntervalDays} días`
                          : " por pago"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        {plan.creditRechargeMode === "PERIODIC" ? (
                          <>
                            <RefreshCw className="h-4 w-4 text-slate-400" />
                            Bono vigente {formatDuration(plan.durationDays)}
                          </>
                        ) : plan.creditsNeverExpire ? (
                          <>
                            <InfinityIcon className="h-4 w-4 text-slate-400" />
                            Los créditos no caducan
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-slate-400" />
                            Caducan a los {plan.durationDays} días
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {formatDuration(plan.durationDays)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4 text-slate-400" />
                    {plan._count.users}{" "}
                    {plan._count.users === 1 ? "cliente" : "clientes"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                  <button
                    onClick={() => handleEditClick(plan)}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && plans.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 shadow-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Create/Edit Plan Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingPlan ? "Editar Tarifa" : "Nueva Tarifa"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPlan(null);
                  }}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto min-h-0">
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
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    Precio final con IVA incluido. El tipo de IVA que se desglosa en la factura lo define el método de pago con el que se cobre.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de tarifa *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, billingType: "DURATION" })}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all",
                        !isCredits
                          ? "border-primary bg-cyan-50/50 dark:bg-cyan-950/20 text-primary dark:text-cyan-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      Por duración
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, billingType: "CREDITS" })}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-semibold transition-all",
                        isCredits
                          ? "border-primary bg-cyan-50/50 dark:bg-cyan-950/20 text-primary dark:text-cyan-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      Por créditos (bono)
                    </button>
                  </div>
                </div>

                {isCredits && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Créditos por {formData.creditRechargeMode === "PERIODIC" ? "ciclo" : "pago"} *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formData.creditsPerCycle}
                        onChange={(e) => setFormData({ ...formData, creditsPerCycle: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Recarga de créditos *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, creditRechargeMode: "PER_PAYMENT" })}
                          className={cn(
                            "rounded-2xl border-2 py-2 px-3 text-xs font-semibold text-left transition-all",
                            formData.creditRechargeMode === "PER_PAYMENT"
                              ? "border-primary bg-cyan-50/50 dark:bg-cyan-950/20 text-primary dark:text-cyan-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Al pagar/renovar
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, creditRechargeMode: "PERIODIC" })}
                          className={cn(
                            "rounded-2xl border-2 py-2 px-3 text-xs font-semibold text-left transition-all",
                            isPeriodic
                              ? "border-primary bg-cyan-50/50 dark:bg-cyan-950/20 text-primary dark:text-cyan-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          )}
                        >
                          Automática cada X días
                        </button>
                      </div>
                    </div>

                    {isPeriodic && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Recargar cada (días) *
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={formData.rechargeIntervalDays}
                          onChange={(e) => setFormData({ ...formData, rechargeIntervalDays: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    )}

                    {!isPeriodic && (
                      <div className="flex items-center gap-2">
                        <input
                          id="plan-credits-never-expire"
                          type="checkbox"
                          checked={formData.creditsNeverExpire}
                          onChange={(e) => setFormData({ ...formData, creditsNeverExpire: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-305 dark:border-slate-705 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent outline-none cursor-pointer"
                        />
                        <label
                          htmlFor="plan-credits-never-expire"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer"
                        >
                          Los créditos no caducan
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {!durationHidden && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {durationLabel}
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {DURATION_SHORTCUTS.map((s) => (
                        <button
                          key={s.days}
                          type="button"
                          onClick={() => setFormData({ ...formData, durationDays: s.days.toString() })}
                          className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                {editingPlan && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="plan-is-active"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-305 dark:border-slate-705 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent outline-none cursor-pointer"
                    />
                    <label
                      htmlFor="plan-is-active"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer"
                    >
                      Tarifa activa para nuevas contrataciones
                    </label>
                  </div>
                )}
              </div>

                <div className="flex gap-3 p-6 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPlan(null);
                    }}
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
                      editingPlan ? "Guardar Cambios" : "Crear Tarifa"
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
