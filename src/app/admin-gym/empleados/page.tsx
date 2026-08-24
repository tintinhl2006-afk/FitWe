"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  CalendarDays,
  Lock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Employee {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
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
  createdAt: string;
  image: string | null;
  bio: string | null;
}

const provinces = [
  "Sevilla", "Madrid", "Barcelona", "Valencia", "Alicante", "Málaga", "Murcia", "Cádiz", "Baleares", "Las Palmas", "Bizkaia", "A Coruña", "Zaragoza", "Pontevedra", "Asturias", "Tenerife", "Gipuzkoa", "Toledo", "Girona", "Navarra", "Córdoba", "Cantabria", "Castellón", "Valladolid", "Huelva", "Jaén", "Granada", "Tarragona", "Lleida", "Álava", "Badajoz", "Cáceres", "Burgos", "Salamanca", "Ourense", "Lugo", "La Rioja"
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 110 }, (_, i) => String(currentYear - i));

export default function EmployeesPage() {
  const { data: session } = useSession();
  const { showConfirm } = useCustomAlert();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    documentType: "DNI",
    documentPrefix: "-",
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-gym/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error("Error fetching employees:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      lastName: "",
      email: "",
      password: "",
      documentType: "DNI",
      documentPrefix: "-",
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
    setAge(null);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    let bDay = "";
    let bMonth = "";
    let bYear = "";
    if (emp.birthDate) {
      const d = new Date(emp.birthDate);
      bDay = String(d.getDate()).padStart(2, "0");
      bMonth = String(d.getMonth() + 1).padStart(2, "0");
      bYear = String(d.getFullYear());
    }

    let prefix = "-";
    let num = emp.documentNumber || "";
    if (emp.documentType === "NIE" && num) {
      const firstChar = num.charAt(0).toUpperCase();
      if (["X", "Y", "Z"].includes(firstChar)) {
        prefix = firstChar;
        num = num.slice(1);
      }
    }

    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      lastName: emp.lastName || "",
      email: emp.email,
      password: "", // Optional for edit
      documentType: emp.documentType || "DNI",
      documentPrefix: prefix,
      documentNumber: num,
      documentLetter: emp.documentLetter || "",
      phone: emp.phone || "",
      landline: emp.landline || "",
      registrationDate: emp.registrationDate 
        ? new Date(emp.registrationDate).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0],
      address: emp.address || "",
      country: emp.country || "España",
      province: emp.province || "",
      locality: emp.locality || "",
      postalCode: emp.postalCode || "",
      birthDay: bDay,
      birthMonth: bMonth,
      birthYear: bYear,
      civilStatus: emp.civilStatus || "",
      gender: emp.gender || "",
      isRegisteredCitizen: emp.isRegisteredCitizen === true ? "true" : emp.isRegisteredCitizen === false ? "false" : "",
      referralSource: emp.referralSource || "",
      gdprConsent: emp.gdprConsent !== false,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const isEdit = !!editingEmployee;
      const url = "/api/admin-gym/employees";
      const method = isEdit ? "PUT" : "POST";
      
      const birthDateStr = formData.birthDay && formData.birthMonth && formData.birthYear
        ? `${formData.birthYear}-${formData.birthMonth}-${formData.birthDay}`
        : null;

      const payload = {
        name: formData.name,
        lastName: formData.lastName || null,
        email: formData.email,
        password: formData.password,
        documentType: formData.documentType,
        documentNumber: formData.documentType === "NIE" && formData.documentPrefix !== "-"
          ? `${formData.documentPrefix}${formData.documentNumber}`
          : (formData.documentNumber || null),
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

      if (isEdit) {
        (payload as any).id = editingEmployee.id;
        if (!formData.password) {
          delete (payload as any).password;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la solicitud");
      }

      setToast({
        msg: isEdit ? "Empleado actualizado correctamente" : "Empleado creado correctamente",
        type: "ok",
      });
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || "Algo salió mal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (emp: Employee) => {
    showConfirm(
      `¿Estás seguro de que quieres eliminar a ${emp.name}? Las clases asociadas a este empleado conservarán su nombre textual pero no estarán vinculadas a su cuenta.`,
      async () => {
        try {
          const res = await fetch(`/api/admin-gym/employees?id=${emp.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setToast({ msg: "Empleado eliminado correctamente", type: "ok" });
            fetchEmployees();
          } else {
            const data = await res.json();
            setToast({ msg: data.message || "Error al eliminar", type: "err" });
          }
        } catch (e) {
          console.error(e);
          setToast({ msg: "Error de red", type: "err" });
        }
      }
    );
  };

  const normalizeText = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredEmployees = employees.filter((emp) => {
    const normalizedQuery = normalizeText(searchQuery);
    const fullName = emp.lastName ? `${emp.name} ${emp.lastName}` : emp.name;
    return (
      normalizeText(fullName).includes(normalizedQuery) ||
      normalizeText(emp.email).includes(normalizedQuery)
    );
  });

  // Reset to first page whenever the search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const paginatedEmployees = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-primary dark:text-cyan-400" />
            Gestión de Empleados
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {employees.length} empleado{employees.length !== 1 && "s"} registrado{employees.length !== 1 && "s"} en tu gimnasio
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary transition-colors active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Añadir Empleado
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

      {/* Employees Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <UserCheck className="h-8 w-8 text-slate-350" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {searchQuery ? "Sin resultados" : "Aún no tienes empleados"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {searchQuery
              ? "No se encontraron empleados que coincidan con la búsqueda."
              : "Registra a tus entrenadores para que puedan gestionar sus clases y sesiones."}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Añadir primer empleado
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950/40 text-primary dark:text-cyan-400 font-bold text-lg border-2 border-white dark:border-slate-850 shadow-sm">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                      {emp.name} {emp.lastName || ""}
                    </h3>
                    <span className="text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-900/50 uppercase tracking-wider">
                      Instructor
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm font-medium text-slate-650 dark:text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span>Alta: {new Date(emp.registrationDate).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEditModal(emp)}
                  className="p-2 text-slate-500 hover:text-primary dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Editar datos del empleado"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(emp)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                  title="Eliminar empleado"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredEmployees.length > 0 && totalPages > 1 && (
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

      {/* Create / Edit Modal (Ficha Style matching clientes) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-5xl shadow-2xl animate-in slide-in-from-bottom-6 duration-300 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingEmployee ? "Modificar Ficha de Empleado" : "Alta de Ficha de Empleado"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>



            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                
                {error && (
                  <div className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-5 py-3.5 text-sm font-semibold text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 font-bold">¡Error!</span>
                      <span>{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer"
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
                      value={formData.documentType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          documentType: val,
                          documentPrefix: val === "NIE" ? "X" : "-",
                        });
                      }}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
                        value={formData.documentPrefix}
                        onChange={(e) => setFormData({ ...formData, documentPrefix: e.target.value })}
                        className="w-1/4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 px-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {formData.documentType === "NIE" ? (
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
                          formData.documentType === "DNI"
                            ? "Nº dni"
                            : formData.documentType === "NIE"
                            ? "Nº nie"
                            : formData.documentType === "Pasaporte"
                            ? "Nº pasaporte"
                            : "Nº documento"
                        }
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

                  {/* Nombre */}
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

                  {/* Email */}
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

                  {/* Contraseña */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      Contraseña provisional
                    </label>
                    <input
                      type="password"
                      required={!editingEmployee}
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

                  {/* Provincia */}
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

                  {/* Localidad */}
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

                  {/* Fecha de Nacimiento */}
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

                      <div className="w-1/4 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-1 whitespace-nowrap border border-transparent">
                        {age !== null ? `${age} Años` : "— Años"}
                      </div>
                    </div>
                  </div>

                  {/* Estado Civil */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Estado civil
                    </label>
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
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
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                      value={formData.isRegisteredCitizen}
                      onChange={(e) => setFormData({ ...formData, isRegisteredCitizen: e.target.value })}
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
                      value={formData.referralSource}
                      onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
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
              </div>

              <div className="flex justify-end gap-3 px-7 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-3xl bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-6 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-70 transition-all active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar Ficha"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 flex items-center gap-2 rounded-3xl px-4 py-3 shadow-2xl z-50 text-sm font-medium border animate-in slide-in-from-bottom-5",
            toast.type === "ok"
              ? "bg-primary text-white border-cyan-700"
              : "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-350 border-red-200 dark:border-red-800"
          )}
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:bg-white/10 p-1 rounded-full cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
