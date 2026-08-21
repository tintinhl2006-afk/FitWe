"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  CreditCard,
  Building2,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { provinces } from "@/lib/provinces";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

type Gateway = "STRIPE" | "REDSYS";

interface PaymentMethod {
  id: string;
  gateway: Gateway;
  isActive: boolean;
  stripeAccountId: string | null;
  stripeConnected: boolean;
  redsysFuc: string | null;
  redsysTerminal: string | null;
  redsysClave: string | null;
  billingName: string;
  billingDocumentType: string | null;
  billingDocumentNumber: string | null;
  billingPhone: string | null;
  billingEmail: string | null;
  billingAddress: string | null;
  billingCountry: string | null;
  billingProvince: string | null;
  billingLocality: string | null;
  billingPostalCode: string | null;
  vatRate: number;
}

const emptyForm = {
  billingName: "",
  billingDocumentType: "DNI",
  billingDocumentNumber: "",
  billingPhone: "",
  billingEmail: "",
  billingAddress: "",
  billingCountry: "España",
  billingProvince: "",
  billingLocality: "",
  billingPostalCode: "",
  vatRate: "21",
  redsysFuc: "",
  redsysTerminal: "001",
  redsysClave: "",
};

export default function MetodosPagoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showConfirm } = useCustomAlert();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"choose" | "form">("choose");
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/admin-gym/payment-methods");
      if (res.ok) {
        const data = await res.json();
        setMethods(data.methods || []);
      }
    } catch (e) {
      console.error("Error fetching payment methods:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // Verificar el estado tras volver del onboarding de Stripe Connect
  useEffect(() => {
    const status = searchParams.get("stripe_status");
    const methodId = searchParams.get("methodId");
    if (status && methodId) {
      const verify = async () => {
        setConnectingId(methodId);
        try {
          const res = await fetch(`/api/admin-gym/payment-methods/${methodId}/stripe/status`);
          const data = await res.json();
          if (res.ok && data.stripeConnected) {
            showToast("success", data.isMock
              ? "¡Conectado con Stripe Connect (Demostración) con éxito!"
              : "¡Tu cuenta Stripe Connect se ha enlazado correctamente!");
          } else {
            showToast("error", "No se completó el onboarding de Stripe Connect. Inténtalo de nuevo.");
          }
        } catch (e) {
          showToast("error", "Error al verificar el estado de Stripe Connect.");
        } finally {
          setConnectingId(null);
          router.replace("/admin-gym/metodos-pago");
          fetchMethods();
        }
      };
      verify();
    }
  }, [searchParams, router]);

  const openAddModal = () => {
    setEditingMethod(null);
    setModalStep("choose");
    setSelectedGateway(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setSelectedGateway(method.gateway);
    setForm({
      billingName: method.billingName,
      billingDocumentType: method.billingDocumentType || "DNI",
      billingDocumentNumber: method.billingDocumentNumber || "",
      billingPhone: method.billingPhone || "",
      billingEmail: method.billingEmail || "",
      billingAddress: method.billingAddress || "",
      billingCountry: method.billingCountry || "España",
      billingProvince: method.billingProvince || "",
      billingLocality: method.billingLocality || "",
      billingPostalCode: method.billingPostalCode || "",
      vatRate: method.vatRate.toString(),
      redsysFuc: method.redsysFuc || "",
      redsysTerminal: method.redsysTerminal || "001",
      redsysClave: "",
    });
    setModalStep("form");
    setIsModalOpen(true);
  };

  const handleChooseGateway = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setModalStep("form");
  };

  const handleSubmitMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;
    setIsSubmitting(true);
    try {
      const isEditing = !!editingMethod;
      const url = isEditing
        ? `/api/admin-gym/payment-methods/${editingMethod!.id}`
        : "/api/admin-gym/payment-methods";

      // En edición, la clave del TPV se deja en blanco para no cambiarla; solo se envía si
      // el gestor ha escrito una nueva.
      const body: Record<string, any> = isEditing
        ? { ...form, ...(form.redsysClave ? {} : { redsysClave: undefined }) }
        : { gateway: selectedGateway, ...form };

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Error al ${isEditing ? "actualizar" : "crear"} el método de pago`);
      }
      setIsModalOpen(false);
      showToast("success", `Método de pago ${isEditing ? "actualizado" : "añadido"} correctamente`);
      fetchMethods();
    } catch (err: any) {
      showToast("error", err.message || "Error al guardar el método de pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin-gym/payment-methods/${id}/activate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al activar el método de pago");
      }
      showToast("success", "Método de pago activado");
      fetchMethods();
    } catch (err: any) {
      showToast("error", err.message || "Error al activar el método de pago");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMethod = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin-gym/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar el método de pago");
      }
      showToast("success", "Método de pago eliminado");
      fetchMethods();
    } catch (err: any) {
      showToast("error", err.message || "Error al eliminar el método de pago");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "¿Eliminar este método de pago? Las facturas ya emitidas con él conservarán sus datos.",
      () => deleteMethod(id)
    );
  };

  const handleConnectStripe = async (id: string) => {
    setConnectingId(id);
    try {
      const res = await fetch(`/api/admin-gym/payment-methods/${id}/stripe/connect`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al iniciar Stripe Connect");
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      showToast("error", err.message || "Error al conectar con Stripe.");
      setConnectingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative p-6 md:p-8 space-y-8">
      {toast && (
        <div
          className={cn(
            "fixed top-6 left-0 right-0 mx-auto max-w-md rounded-3xl border px-4 py-3 text-sm font-medium shadow-soft transition-all animate-fade-in-up flex items-center gap-2 z-50",
            toast.type === "success"
              ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800 text-primary dark:text-cyan-300"
              : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Métodos de Pago</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Da de alta las cuentas Stripe o TPV con las que cobras a tus clientes. Solo una puede estar activa a la vez.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary hover:opacity-95 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Añadir método de pago
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-white dark:bg-slate-900">
          <CreditCard className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
            No tienes ningún método de pago configurado todavía
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Añade una cuenta Stripe o TPV Redsys para que tus clientes puedan pagar su cuota online.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => {
            const needsStripeConnect = m.gateway === "STRIPE" && !m.stripeConnected;
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl border p-5 space-y-4 bg-white dark:bg-slate-900 shadow-sm",
                  m.isActive ? "border-emerald-400 dark:border-emerald-600" : "border-slate-200 dark:border-slate-800"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", m.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {m.gateway === "STRIPE" ? "Stripe Connect" : "TPV Virtual Redsys"}
                    </h4>
                  </div>
                  {m.isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{m.billingName}</p>
                  <p>IVA: {m.vatRate}%</p>
                  {m.billingDocumentNumber && (
                    <p>{m.billingDocumentType || "NIF"}: {m.billingDocumentNumber}</p>
                  )}
                  {m.gateway === "REDSYS" && m.redsysFuc && <p className="font-mono">FUC: {m.redsysFuc}</p>}
                  {m.gateway === "STRIPE" && (
                    <p>{m.stripeConnected ? "Cuenta bancaria conectada" : "Pendiente de conectar cuenta bancaria"}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-850">
                  {needsStripeConnect && (
                    <button
                      type="button"
                      onClick={() => handleConnectStripe(m.id)}
                      disabled={connectingId === m.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#635BFF] hover:bg-[#5951e5] px-3 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-60"
                    >
                      {connectingId === m.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Conectar con Stripe
                    </button>
                  )}
                  {!m.isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(m.id)}
                      disabled={busyId === m.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Activar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={busyId === m.id}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-60 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {modalStep === "choose"
                  ? "Añadir método de pago"
                  : editingMethod
                  ? selectedGateway === "STRIPE" ? "Editar cuenta Stripe Connect" : "Editar TPV Redsys"
                  : selectedGateway === "STRIPE" ? "Nueva cuenta Stripe Connect" : "Nuevo TPV Redsys"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {modalStep === "choose" ? (
              <div className="p-5 space-y-3 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleChooseGateway("STRIPE")}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-primary text-left transition-all cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-xl bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-[#635BFF]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Stripe Connect</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tarjeta, Apple Pay, Google Pay</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChooseGateway("REDSYS")}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-primary text-left transition-all cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">TPV Virtual Redsys</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Banca tradicional (CaixaBank, BBVA, Santander...)</p>
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitMethod} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto min-h-0">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-3">
                    Datos fiscales de facturación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nombre / Razón social</label>
                      <input
                        type="text"
                        required
                        value={form.billingName}
                        onChange={(e) => setForm({ ...form, billingName: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">IVA aplicado (%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.vatRate}
                        onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="mt-1 text-[10px] text-slate-405 dark:text-slate-500">
                        Se desglosa en las facturas de los pagos cobrados con este método (el precio de la tarifa ya incluye este IVA).
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tipo de documento</label>
                      <select
                        value={form.billingDocumentType}
                        onChange={(e) => setForm({ ...form, billingDocumentType: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CIF">CIF</option>
                        <option value="NIE">NIE</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Número de documento</label>
                      <input
                        type="text"
                        placeholder="Ej. 12345678Z o B12345678"
                        value={form.billingDocumentNumber}
                        onChange={(e) => setForm({ ...form, billingDocumentNumber: e.target.value.toUpperCase() })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Teléfono</label>
                      <input
                        type="text"
                        value={form.billingPhone}
                        onChange={(e) => setForm({ ...form, billingPhone: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email de facturación</label>
                      <input
                        type="email"
                        value={form.billingEmail}
                        onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Dirección fiscal</label>
                      <input
                        type="text"
                        value={form.billingAddress}
                        onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Provincia</label>
                      <select
                        value={form.billingProvince}
                        onChange={(e) => setForm({ ...form, billingProvince: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Seleccionar...</option>
                        {provinces.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Localidad</label>
                      <input
                        type="text"
                        value={form.billingLocality}
                        onChange={(e) => setForm({ ...form, billingLocality: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Código Postal</label>
                      <input
                        type="text"
                        value={form.billingPostalCode}
                        onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value })}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {selectedGateway === "REDSYS" && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-3">
                      Credenciales del TPV
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Número de Comercio (FUC)</label>
                        <input
                          type="text"
                          required
                          value={form.redsysFuc}
                          onChange={(e) => setForm({ ...form, redsysFuc: e.target.value.replace(/\D/g, "") })}
                          placeholder="Ej. 349281723"
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Número de Terminal</label>
                        <input
                          type="text"
                          value={form.redsysTerminal}
                          onChange={(e) => setForm({ ...form, redsysTerminal: e.target.value.replace(/\D/g, "") })}
                          placeholder="001"
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Clave de Encriptación SHA-256</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Key className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="password"
                            required={!editingMethod}
                            value={form.redsysClave}
                            onChange={(e) => setForm({ ...form, redsysClave: e.target.value })}
                            placeholder={editingMethod ? "Dejar en blanco para no cambiarla" : "••••••••••••••••"}
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 pl-9 pr-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGateway === "STRIPE" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tras crear el método podrás conectar tu cuenta bancaria de Stripe desde su tarjeta en el listado.
                  </p>
                )}
              </div>

                <div className="flex justify-end gap-2 p-5 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => (editingMethod ? setIsModalOpen(false) : setModalStep("choose"))}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {editingMethod ? "Cancelar" : "Atrás"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl bg-primary hover:opacity-95 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer",
                      isSubmitting && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
