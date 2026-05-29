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

const provinces = [
  "Sevilla", "Madrid", "Barcelona", "Valencia", "Alicante", "Málaga", "Murcia", "Cádiz", "Baleares", "Las Palmas", "Bizkaia", "A Coruña", "Zaragoza", "Pontevedra", "Asturias", "Tenerife", "Gipuzkoa", "Toledo", "Girona", "Navarra", "Córdoba", "Cantabria", "Castellón", "Valladolid", "Huelva", "Jaén", "Granada", "Tarragona", "Lleida", "Álava", "Badajoz", "Cáceres", "Burgos", "Salamanca", "Ourense", "Lugo", "La Rioja"
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 110 }, (_, i) => String(currentYear - i));

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
    lastName: "",
    documentType: "DNI",
    documentNumber: "",
    documentLetter: "",
    phone: "",
    landline: "",
    registrationDate: new Date().toISOString().split("T")[0],
    address: "",
    country: "España",
    province: "",
    locality: "",
    postalCode: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    civilStatus: "",
    gender: "",
    isRegisteredCitizen: "",
    referralSource: "",
    gdprConsent: true,
  });

  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      const day = parseInt(formData.birthDay);
      const month = parseInt(formData.birthMonth) - 1;
      const year = parseInt(formData.birthYear);
      const birth = new Date(year, month, day);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? calculatedAge : 0);
    } else {
      setAge(null);
    }
  }, [formData.birthDay, formData.birthMonth, formData.birthYear]);

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

    if (!formData.name.trim()) {
      setFormError("Es necesario introducir un valor para 'Nombre'");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Es necesario introducir un valor para 'Correo electrónico'");
      return;
    }

    if (!formData.password.trim()) {
      setFormError("Es necesario introducir un valor para 'Contraseña provisional'");
      return;
    }

    setIsSubmitting(true);

    try {
      const birthDateStr = formData.birthDay && formData.birthMonth && formData.birthYear
        ? `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`
        : null;

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        lastName: formData.lastName || null,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber || null,
        documentLetter: formData.documentLetter || null,
        phone: formData.phone || null,
        landline: formData.landline || null,
        registrationDate: formData.registrationDate,
        address: formData.address || null,
        country: formData.country,
        province: formData.province || null,
        locality: formData.locality || null,
        postalCode: formData.postalCode || null,
        birthDate: birthDateStr,
        civilStatus: formData.civilStatus || null,
        gender: formData.gender || null,
        isRegisteredCitizen: formData.isRegisteredCitizen === "true",
        referralSource: formData.referralSource || null,
        gdprConsent: formData.gdprConsent,
      };

      const res = await fetch("/api/admin-gym/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const newClient = await res.json();
        // Add to local state instantly
        setClients((prev) => [newClient, ...prev]);
        setIsModalOpen(false);
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
    setFormData({
      name: "",
      email: "",
      password: "",
      lastName: "",
      documentType: "DNI",
      documentNumber: "",
      documentLetter: "",
      phone: "",
      landline: "",
      registrationDate: new Date().toISOString().split("T")[0],
      address: "",
      country: "España",
      province: "",
      locality: "",
      postalCode: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      civilStatus: "",
      gender: "",
      isRegisteredCitizen: "",
      referralSource: "",
      gdprConsent: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const normalizeText = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = clients.filter((c) => {
    const normalizedQuery = normalizeText(searchQuery);
    return (
      normalizeText(c.name).includes(normalizedQuery) ||
      normalizeText(c.email).includes(normalizedQuery)
    );
  });

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
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 px-2.5 py-0.5 text-xs font-bold text-primary dark:text-cyan-400 whitespace-nowrap">
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

      {/* ── Modal: Alta de Ficha ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-5xl shadow-2xl animate-in slide-in-from-bottom-6 duration-300 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Alta de Ficha
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Banner */}
            <div className="bg-[#1e6091] text-white font-semibold text-sm px-7 py-3 tracking-wide">
              Paso 1. Datos del socio
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClient} className="px-7 py-6 space-y-6">
              {/* Error Message Box (Screenshot Style) */}
              {formError && (
                <div className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-5 py-3.5 text-sm font-semibold text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 font-bold">¡Error!</span>
                    <span>{formError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError("")}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* ── FILA 1 ── */}
                {/* Tipo de Documento */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Tipo de documento
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Documento (Prefix + Number + Letter) */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Documento
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="-">-</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Nº dni"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-2/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Letra"
                      maxLength={1}
                      value={formData.documentLetter}
                      onChange={(e) => setFormData({ ...formData, documentLetter: e.target.value.toUpperCase() })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-center text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Nombre (Requerido) */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Apellidos */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* ── FILA 2 ── */}
                {/* Móvil */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Móvil
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Teléfono */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.landline}
                    onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Email (Requerido) */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Contraseña provisional (Requerido para cuenta) */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Contraseña provisional
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mín. 6 caracteres"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Fecha de alta */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Fecha de alta
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* ── FILA 3 ── */}
                {/* Dirección */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* País */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    País
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="España">España</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Provincia (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Provincia
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar...</option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Localidad (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Localidad"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Código Postal */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* ── FILA 4 ── */}
                {/* Fecha de Nacimiento (Live Age display) */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Fecha de Nacimiento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.birthDay}
                      onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Día</option>
                      {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={formData.birthMonth}
                      onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Mes</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Año</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    {/* Dynamic Age Calculator Display */}
                    <div className="w-1/4 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-1 whitespace-nowrap border border-transparent">
                      {age !== null ? `${age} Años` : "— Años"}
                    </div>
                  </div>
                </div>

                {/* Estado Civil (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Estado civil
                  </label>
                  <select
                    value={formData.civilStatus}
                    onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                  </select>
                </div>

                {/* Sexo (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Sexo
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Varón">Varón</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Empadronado (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Empadronado
                  </label>
                  <select
                    value={formData.isRegisteredCitizen}
                    onChange={(e) => setFormData({ ...formData, isRegisteredCitizen: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Difusión (Default unselected) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Difusión
                  </label>
                  <select
                    value={formData.referralSource}
                    onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Me lo ha dicho un amigo">Me lo ha dicho un amigo</option>
                    <option value="Redes Sociales">Redes Sociales</option>
                    <option value="Publicidad">Publicidad</option>
                    <option value="Búsqueda en Internet">Búsqueda en Internet</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* ── FILA 5 ── */}
                {/* Autorización RGPD */}
                <div className="col-span-1 md:col-span-12 flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="gdprConsent"
                    checked={formData.gdprConsent}
                    onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="gdprConsent" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    Autorización RGPD (Consentimiento inequívoco para el tratamiento de datos personales)
                  </label>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#0f172a] text-white px-5 py-2.5 text-sm font-semibold opacity-50 cursor-not-allowed"
                >
                  &lt; Atrás
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-6 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-70 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Siguiente >"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
