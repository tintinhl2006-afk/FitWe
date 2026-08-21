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
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface PaymentRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface GymPlan {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  billingType: "DURATION" | "CREDITS";
  creditsPerCycle: number | null;
  creditRechargeMode: "PER_PAYMENT" | "PERIODIC" | null;
  rechargeIntervalDays: number | null;
  durationDays: number;
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

const provinces = [
  "Sevilla", "Madrid", "Barcelona", "Valencia", "Alicante", "Málaga", "Murcia", "Cádiz", "Baleares", "Las Palmas", "Bizkaia", "A Coruña", "Zaragoza", "Pontevedra", "Asturias", "Tenerife", "Gipuzkoa", "Toledo", "Girona", "Navarra", "Córdoba", "Cantabria", "Castellón", "Valladolid", "Huelva", "Jaén", "Granada", "Tarragona", "Lleida", "Álava", "Badajoz", "Cáceres", "Burgos", "Salamanca", "Ourense", "Lugo", "La Rioja"
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 110 }, (_, i) => String(currentYear - i));

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
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentLetter: string | null;
  phone: string | null;
  landline: string | null;
  registrationDate: string;
  address: string | null;
  country: string | null;
  province: string | null;
  locality: string | null;
  postalCode: string | null;
  birthDate: string | null;
  civilStatus: string | null;
  gender: string | null;
  isRegisteredCitizen: boolean;
  referralSource: string | null;
  gdprConsent: boolean;
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
  const { showConfirm } = useCustomAlert();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [gymPlans, setGymPlans] = useState<GymPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planModalError, setPlanModalError] = useState("");
  const selectedPlan = gymPlans.find((p) => p.id === selectedPlanId) || null;

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    lastName: "",
    documentType: "DNI",
    documentPrefix: "-",
    documentNumber: "",
    documentLetter: "",
    phone: "",
    landline: "",
    registrationDate: "",
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

  const [editAge, setEditAge] = useState<number | null>(null);

  useEffect(() => {
    if (editFormData.birthDay && editFormData.birthMonth && editFormData.birthYear) {
      const day = parseInt(editFormData.birthDay);
      const month = parseInt(editFormData.birthMonth) - 1;
      const year = parseInt(editFormData.birthYear);
      const birth = new Date(year, month, day);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setEditAge(calculatedAge >= 0 ? calculatedAge : 0);
    } else {
      setEditAge(null);
    }
  }, [editFormData.birthDay, editFormData.birthMonth, editFormData.birthYear]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setIsPasswordSubmitting(true);

    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordSuccess("Contraseña cambiada correctamente");
        setNewPassword("");
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess("");
        }, 1500);
      } else {
        setPasswordError(data.message || "Error al cambiar la contraseña");
      }
    } catch (e) {
      console.error(e);
      setPasswordError("Error al conectar con el servidor");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (!client) return;

    let bDay = "";
    let bMonth = "";
    let bYear = "";
    if (client.birthDate) {
      const d = new Date(client.birthDate);
      bDay = String(d.getDate()).padStart(2, "0");
      bMonth = String(d.getMonth() + 1).padStart(2, "0");
      bYear = String(d.getFullYear());
    }

    let prefix = "-";
    let num = client.documentNumber || "";
    if (client.documentType === "NIE" && num) {
      const firstChar = num.charAt(0).toUpperCase();
      if (["X", "Y", "Z"].includes(firstChar)) {
        prefix = firstChar;
        num = num.slice(1);
      }
    }

    setEditFormData({
      name: client.name || "",
      email: client.email || "",
      lastName: client.lastName || "",
      documentType: client.documentType || "DNI",
      documentPrefix: prefix,
      documentNumber: num,
      documentLetter: client.documentLetter || "",
      phone: client.phone || "",
      landline: client.landline || "",
      registrationDate: client.registrationDate ? client.registrationDate.split("T")[0] : new Date().toISOString().split("T")[0],
      address: client.address || "",
      country: client.country || "España",
      province: client.province || "",
      locality: client.locality || "",
      postalCode: client.postalCode || "",
      birthDay: bDay,
      birthMonth: bMonth,
      birthYear: bYear,
      civilStatus: client.civilStatus || "",
      gender: client.gender || "",
      isRegisteredCitizen: client.isRegisteredCitizen === true ? "true" : (client.isRegisteredCitizen === false ? "false" : ""),
      referralSource: client.referralSource || "",
      gdprConsent: client.gdprConsent !== false,
    });
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");

    if (!editFormData.name.trim()) {
      setEditFormError("Es necesario introducir un valor para 'Nombre'");
      return;
    }

    if (!editFormData.email.trim()) {
      setEditFormError("Es necesario introducir un valor para 'Correo electrónico'");
      return;
    }

    setIsEditSubmitting(true);

    try {
      const birthDateStr = editFormData.birthDay && editFormData.birthMonth && editFormData.birthYear
        ? `${editFormData.birthYear}-${editFormData.birthMonth}-${editFormData.birthDay}`
        : null;

      const finalDocNum = editFormData.documentType === "NIE" && editFormData.documentPrefix !== "-"
        ? `${editFormData.documentPrefix}${editFormData.documentNumber}`
        : editFormData.documentNumber;

      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        lastName: editFormData.lastName || null,
        documentType: editFormData.documentType,
        documentNumber: finalDocNum || null,
        documentLetter: editFormData.documentLetter || null,
        phone: editFormData.phone || null,
        landline: editFormData.landline || null,
        registrationDate: editFormData.registrationDate,
        address: editFormData.address || null,
        country: editFormData.country,
        province: editFormData.province || null,
        locality: editFormData.locality || null,
        postalCode: editFormData.postalCode || null,
        birthDate: birthDateStr,
        civilStatus: editFormData.civilStatus || null,
        gender: editFormData.gender || null,
        isRegisteredCitizen: editFormData.isRegisteredCitizen === "true",
        referralSource: editFormData.referralSource || null,
        gdprConsent: editFormData.gdprConsent,
      };

      const res = await fetch(`/api/admin-gym/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchClient();
      } else {
        const data = await res.json();
        setEditFormError(data.message || "Error al actualizar la ficha");
      }
    } catch (error) {
      setEditFormError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
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

  const fetchGymPlans = async () => {
    try {
      const res = await fetch("/api/admin-gym/plans");
      if (res.ok) {
        const data: GymPlan[] = await res.json();
        setGymPlans(data.filter((p) => p.isActive));
      }
    } catch (e) {
      console.error("Error fetching plans:", e);
    }
  };

  useEffect(() => {
    fetchClient();
    fetchPayments();
    fetchGymPlans();
  }, [clientId]);

  const handleDeactivate = () => {
    showConfirm(`¿Seguro que quieres desactivar el acceso de ${client?.name}?`, async () => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/admin-gym/clients/${clientId}/subscription`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deactivate" }),
        });
        if (res.ok) {
          fetchClient();
          fetchPayments();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const openPlanModal = () => {
    setSelectedPlanId(gymPlans[0]?.id || "");
    setPlanModalError("");
    setIsPlanModalOpen(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedPlanId) return;
    setIsUpdating(true);
    setPlanModalError("");
    try {
      const res = await fetch(`/api/admin-gym/clients/${clientId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al asignar la tarifa");
      setIsPlanModalOpen(false);
      fetchClient();
      fetchPayments();
    } catch (e: any) {
      setPlanModalError(e.message || "Error al asignar la tarifa");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/admin-gym/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={openEditModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-primary dark:text-cyan-400 px-5 py-2.5 text-sm font-semibold border border-cyan-100 dark:border-cyan-900/50 transition-all active:scale-95"
          >
            <Edit className="h-4 w-4" />
            Editar Ficha
          </button>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          >
            <Key className="h-4 w-4" />
            Cambiar Contraseña
          </button>
          <Link
            href={`/admin-gym/clientes/${clientId}/rutinas`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors active:scale-95"
          >
            <Dumbbell className="h-4 w-4" />
            Gestionar Rutinas
          </Link>
        </div>
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

      {/* ── Ficha de Datos Personales ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20">
          <User className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Ficha de Datos Personales
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          {/* Nombre y Apellidos */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nombre Completo</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.name} {client.lastName || ""}
            </p>
          </div>

          {/* Documento de Identidad */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Documento de Identidad</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.documentType || "DNI"}: {client.documentNumber || ""}{client.documentLetter || ""}
              {!client.documentNumber && <span className="text-slate-400">Sin registrar</span>}
            </p>
          </div>

          {/* Contacto (Móvil / Teléfono) */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contacto</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.phone && <span>📱 {client.phone}</span>}
              {client.landline && <span className="ml-2 text-xs text-slate-500">(📞 {client.landline})</span>}
              {!client.phone && !client.landline && <span className="text-slate-400">Sin registrar</span>}
            </p>
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dirección Física</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {[
                client.address,
                client.locality,
                client.province,
                client.postalCode,
                client.country
              ].filter(Boolean).join(", ") || <span className="text-slate-400">Sin registrar</span>}
            </p>
          </div>

          {/* Fecha de Nacimiento / Edad */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nacimiento (Edad)</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.birthDate ? (
                <>
                  {new Date(client.birthDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    {(() => {
                      const birth = new Date(client.birthDate);
                      const today = new Date();
                      let ageYears = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                        ageYears--;
                      }
                      return ageYears >= 0 ? ageYears : 0;
                    })()} años
                  </span>
                </>
              ) : (
                <span className="text-slate-400">Sin registrar</span>
              )}
            </p>
          </div>

          {/* Estado civil */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estado Civil</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.civilStatus || <span className="text-slate-400">Sin seleccionar</span>}
            </p>
          </div>

          {/* Sexo */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sexo</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.gender || <span className="text-slate-400">Sin seleccionar</span>}
            </p>
          </div>

          {/* Empadronado */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Empadronado</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.isRegisteredCitizen ? "Sí" : "No"}
            </p>
          </div>

          {/* Canal de Difusión */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Canal de Difusión</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {client.referralSource || <span className="text-slate-400">Sin registrar</span>}
            </p>
          </div>

          {/* Autorización RGPD */}
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Consentimiento RGPD</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              {client.gdprConsent ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Autorizado</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-bold">No Autorizado</span>
                </>
              )}
            </p>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
              {(client.subscriptionStatus === "ACTIVE" && !isExpired) ? (
                <button
                  disabled={isUpdating}
                  onClick={handleDeactivate}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-3xl text-sm font-bold transition-all shadow-sm active:scale-95 bg-red-600 text-white hover:bg-red-700 shadow-red-200 dark:shadow-none"
                >
                  Desactivar Acceso
                </button>
              ) : (
                <button
                  disabled={isUpdating || gymPlans.length === 0}
                  onClick={openPlanModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-3xl text-sm font-bold transition-all shadow-sm active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none disabled:opacity-60"
                >
                  Asignar Tarifa
                </button>
              )}
              <div className="text-sm text-center sm:text-left w-full sm:w-auto">
                <p className="font-bold dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  {client.subscriptionStatus === "ACTIVE" && !isExpired ? (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                  {client.subscriptionStatus === "ACTIVE" ? (isExpired ? "Suscripción Expirada" : "Suscripción Activa") : "Acceso Desactivado"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {client.subscriptionStatus === "ACTIVE" && !isExpired ? "El usuario puede acceder a todas las funciones." : "El usuario tiene el acceso restringido."}
                </p>
              </div>
            </div>

            {(client.subscriptionStatus === "ACTIVE" && !isExpired) && (
              <button
                disabled={isUpdating || gymPlans.length === 0}
                onClick={openPlanModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-3xl bg-cyan-50 dark:bg-cyan-950/40 text-primary dark:text-cyan-400 px-6 py-3 text-sm font-bold hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors border border-cyan-100 dark:border-cyan-900/50 disabled:opacity-60"
              >
                Renovar / Registrar Pago
              </button>
            )}
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

            <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
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

      {/* ── Assign Plan Modal (pago en efectivo/manual) ── */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Asignar Tarifa</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Elige la tarifa que ha pagado el cliente (por ejemplo, en efectivo). Se activará su acceso y se generará la factura correspondiente.
              </p>

              {planModalError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {planModalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tarifa
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:outline-none sm:text-sm"
                >
                  {gymPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.price.toFixed(2)}€
                      {plan.billingType === "CREDITS" ? ` (${plan.creditsPerCycle} créditos)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3.5 text-xs flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                  <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                  {selectedPlan.billingType === "CREDITS"
                    ? `Se le concederán ${selectedPlan.creditsPerCycle} créditos.`
                    : `Se le activará el acceso por ${selectedPlan.durationDays} días.`}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignPlan}
                  disabled={isUpdating || !selectedPlanId}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-70 transition-colors"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Pago y Activar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Ficha de Cliente ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-5xl shadow-2xl animate-in slide-in-from-bottom-6 duration-300 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Editar Ficha de Cliente
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>



            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="px-7 py-6 space-y-6">
              {/* Error Message Box */}
              {editFormError && (
                <div className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-5 py-3.5 text-sm font-semibold text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 font-bold">¡Error!</span>
                    <span>{editFormError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditFormError("")}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Tipo de Documento */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Tipo de documento
                  </label>
                  <select
                    value={editFormData.documentType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        documentType: val,
                        documentPrefix: val === "NIE" ? "X" : "-",
                      });
                    }}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Documento */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Documento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editFormData.documentPrefix}
                      onChange={(e) => setEditFormData({ ...editFormData, documentPrefix: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {editFormData.documentType === "NIE" ? (
                        <>
                          <option value="X">X</option>
                          <option value="Y">Y</option>
                          <option value="Z">Z</option>
                        </>
                      ) : (
                        <option value="-">-</option>
                      )}
                    </select>
                    <input
                      type="text"
                      placeholder={
                        editFormData.documentType === "DNI"
                          ? "Nº dni"
                          : editFormData.documentType === "NIE"
                          ? "Nº nie"
                          : editFormData.documentType === "Pasaporte"
                          ? "Nº pasaporte"
                          : "Nº documento"
                      }
                      value={editFormData.documentNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                      className="w-2/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Letra"
                      maxLength={1}
                      value={editFormData.documentLetter}
                      onChange={(e) => setEditFormData({ ...editFormData, documentLetter: e.target.value.toUpperCase() })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-center text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Nombre */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Móvil */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Móvil
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                    value={editFormData.landline}
                    onChange={(e) => setEditFormData({ ...editFormData, landline: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Email */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Fecha de alta */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Fecha de alta
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.registrationDate}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Dirección */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* País */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    País
                  </label>
                  <select
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="España">España</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Provincia */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Provincia
                  </label>
                  <select
                    value={editFormData.province}
                    onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccionar...</option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Localidad */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Localidad"
                    value={editFormData.locality}
                    onChange={(e) => setEditFormData({ ...editFormData, locality: e.target.value })}
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
                    value={editFormData.postalCode}
                    onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Fecha de Nacimiento
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editFormData.birthDay}
                      onChange={(e) => setEditFormData({ ...editFormData, birthDay: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Día</option>
                      {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={editFormData.birthMonth}
                      onChange={(e) => setEditFormData({ ...editFormData, birthMonth: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Mes</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={editFormData.birthYear}
                      onChange={(e) => setEditFormData({ ...editFormData, birthYear: e.target.value })}
                      className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Año</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <div className="w-1/4 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-1 whitespace-nowrap border border-transparent">
                      {editAge !== null ? `${editAge} Años` : "— Años"}
                    </div>
                  </div>
                </div>

                {/* Estado Civil */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Estado civil
                  </label>
                  <select
                    value={editFormData.civilStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, civilStatus: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                  </select>
                </div>

                {/* Sexo */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Sexo
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Varón">Varón</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Empadronado */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Empadronado
                  </label>
                  <select
                    value={editFormData.isRegisteredCitizen}
                    onChange={(e) => setEditFormData({ ...editFormData, isRegisteredCitizen: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Difusión */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Difusión
                  </label>
                  <select
                    value={editFormData.referralSource}
                    onChange={(e) => setEditFormData({ ...editFormData, referralSource: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Sin seleccionar</option>
                    <option value="Me lo ha dicho un amigo">Me lo ha dicho un amigo</option>
                    <option value="Redes Sociales">Redes Sociales</option>
                    <option value="Publicidad">Publicidad</option>
                    <option value="Búsqueda en Internet">Búsqueda en Internet</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Autorización RGPD */}
                <div className="col-span-1 md:col-span-12 flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="editGdprConsent"
                    checked={editFormData.gdprConsent}
                    onChange={(e) => setEditFormData({ ...editFormData, gdprConsent: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="editGdprConsent" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    Autorización RGPD (Consentimiento inequívoco para el tratamiento de datos personales)
                  </label>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-6 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-70 transition-all active:scale-95"
                >
                  {isEditSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Change Password Modal ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Cambiar Contraseña
              </h3>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nueva Contraseña para {client.name}
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Introduce la nueva contraseña..."
                  className="block w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 px-4 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting || !newPassword}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-70 transition-colors active:scale-95"
                >
                  {isPasswordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
