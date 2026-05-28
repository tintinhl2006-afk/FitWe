"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  User as UserIcon, 
  Loader2, 
  X,
  CheckCircle2,
  Trash2,
  CalendarDays,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface GymClass {
  id: string;
  name: string;
  description: string | null;
  instructor: string;
  capacity: number;
  startTime: string;
  endTime: string;
  templateId: string | null;
  _count: {
    bookings: number;
  };
}

interface ClassTemplate {
  id: string;
  name: string;
  instructor: string;
  capacity: number;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

interface BookingUser {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    subscriptionStatus: string;
  };
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function GymClassesPage() {
  const { data: session } = useSession();
  const { showConfirm, showAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<"calendar" | "templates">("calendar");
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Lazy loading state
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [classBookings, setClassBookings] = useState<BookingUser[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [isCancelingBookingId, setIsCancelingBookingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    instructor: "",
    capacity: "20",
    dayOfWeek: "1",
    startTime: "10:00",
    durationMinutes: "60"
  });

  const [isSingleFormOpen, setIsSingleFormOpen] = useState(false);
  const [singleClassFormData, setSingleClassFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    capacity: "20",
    date: session?.user?.serverNow 
      ? new Date(session.user.serverNow).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    startTime: "10:00",
    endTime: "11:00"
  });

  // Effect to update date if session loads later
  useEffect(() => {
    if (session?.user?.serverNow) {
      setSingleClassFormData(prev => ({
        ...prev,
        date: new Date(session.user.serverNow).toISOString().split('T')[0]
      }));
    }
  }, [session?.user?.serverNow]);

  useEffect(() => {
    if (activeTab === "calendar") fetchClasses();
    else fetchTemplates();
  }, [activeTab]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-gym/classes");
      if (res.ok) setClasses(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-gym/templates");
      if (res.ok) setTemplates(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin-gym/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateFormData),
      });
      if (!res.ok) throw new Error("Error al crear plantilla");
      setToast({ msg: "Plantilla guardada y clases generadas para los próximos 7 días.", type: "ok" });
      setIsFormOpen(false);
      setTemplateFormData({ name: "", instructor: "", capacity: "20", dayOfWeek: "1", startTime: "10:00", durationMinutes: "60" });
      fetchTemplates();
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateSingleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin-gym/classes/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleClassFormData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear la clase");
      }
      setToast({ msg: "Evento especial creado correctamente", type: "ok" });
      setIsSingleFormOpen(false);
      setSingleClassFormData({ ...singleClassFormData, name: "", description: "" });
      fetchClasses();
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteTemplate = (id: string) => {
    showConfirm("¿Eliminar esta plantilla? Las clases ya generadas no se eliminarán.", async () => {
      try {
        await fetch(`/api/admin-gym/templates?id=${id}`, { method: "DELETE" });
        fetchTemplates();
      } catch (e) { console.error(e); }
    });
  };

  const handleCancelClass = (id: string) => {
    showConfirm("¿Cancelar esta clase? Se eliminarán todas las reservas asociadas.", async () => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/admin-gym/classes?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          setToast({ msg: "Clase cancelada correctamente", type: "ok" });
          fetchClasses();
        }
      } catch (e) { console.error(e); }
      finally { setDeletingId(null); }
    });
  };

  const handleViewClassDetails = async (c: GymClass) => {
    setSelectedClass(c);
    setIsBookingsLoading(true);
    setClassBookings([]);
    try {
      const res = await fetch(`/api/admin-gym/classes/${c.id}/bookings`);
      if (res.ok) {
        const data = await res.json();
        setClassBookings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBookingsLoading(false);
    }
  };

  const handleCancelBooking = (bookingId: string, classId: string) => {
    showConfirm("¿Liberar plaza de este usuario?", async () => {
      setIsCancelingBookingId(bookingId);
      try {
        const res = await fetch(`/api/admin-gym/classes/${classId}/bookings?bookingId=${bookingId}`, { method: "DELETE" });
        if (res.ok) {
          setToast({ msg: "Reserva cancelada (Plaza liberada)", type: "ok" });
          setClassBookings(prev => prev.filter(b => b.id !== bookingId));
          setClasses(prev => prev.map(c => c.id === classId ? { ...c, _count: { bookings: Math.max(0, c._count.bookings - 1) } } : c));
        }
      } catch (e) { console.error(e); }
      finally { setIsCancelingBookingId(null); }
    });
  };

  // Group classes by date
  const now = session?.user?.serverNow ? new Date(session.user.serverNow) : new Date();
  
  // If a date is selected, we filter ALL classes on that date (even if past).
  // If NO date is selected, we only show upcoming classes.
  const filteredClasses = selectedDate
    ? classes.filter((c) => {
        const classDate = new Date(c.startTime).toISOString().split("T")[0];
        return classDate === selectedDate;
      })
    : classes.filter(c => new Date(c.startTime) >= now);

  const groupedUpcoming = filteredClasses.reduce<Record<string, GymClass[]>>((acc, c) => {
    const dateKey = new Date(c.startTime).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="h-7 w-7 text-primary dark:text-cyan-400" />
            Clases y Actividades
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona el horario semanal y eventos especiales.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsSingleFormOpen(true)}
            className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <CalendarDays className="h-5 w-5" />
            Evento Especial
          </button>
          <button
            onClick={() => {
              setActiveTab("templates");
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-3xl bg-primary hover:bg-primary text-white px-5 py-2.5 font-semibold shadow-soft shadow-cyan-500/20 transition-all"
          >
            <Plus className="h-5 w-5" />
            Nueva Plantilla
          </button>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "calendar" 
              ? "border-primary text-primary dark:text-cyan-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Calendario de Clases
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "templates" 
              ? "border-primary text-primary dark:text-cyan-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Plantillas Semanales
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : activeTab === "calendar" ? (
        /* CALENDAR TAB */
        <div className="space-y-8 animate-in fade-in duration-300">
          {(classes.length > 0 || selectedDate) && (
            <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-900/15 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-cyan-500" /> Selecciona una fecha
                </h2>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="text-xs font-bold text-primary hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Ver todas
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Rolling 14-day selector */}
                <div className="flex-1 flex overflow-x-auto gap-2.5 pb-1.5 scrollbar-none scroll-smooth">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const d = new Date(now);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split("T")[0];
                    
                    const dayName = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
                    const dayNum = d.getDate();
                    const monthName = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
                    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    
                    // Count classes for this date
                    const classCount = classes.filter(c => {
                      return new Date(c.startTime).toISOString().split("T")[0] === dateStr;
                    }).length;
                    
                    const isSelected = selectedDate === dateStr;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(isSelected ? "" : dateStr)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[72px] py-3.5 rounded-2xl border transition-all duration-200 cursor-pointer",
                          isSelected
                            ? "bg-gradient-to-br from-cyan-500 to-primary text-white border-transparent shadow-md shadow-cyan-500/20 scale-102"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider",
                          isSelected ? "text-cyan-100" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {capitalizedDay}
                        </span>
                        <span className="text-xl font-black mt-1 leading-none">
                          {dayNum}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold mt-1",
                          isSelected ? "text-cyan-200" : "text-slate-500 dark:text-slate-550"
                        )}>
                          {capitalizedMonth}
                        </span>
                        
                        {classCount > 0 && (
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-2",
                            isSelected ? "bg-white" : "bg-primary dark:bg-cyan-400"
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Premium calendar date picker button */}
                <div className="shrink-0 relative w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-cyan-400 transition-all cursor-pointer shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Seleccionar otra fecha"
                  />
                </div>
              </div>
            </div>
          )}

          {Object.keys(groupedUpcoming).length > 0 ? (
            Object.entries(groupedUpcoming).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 capitalize">
                  {date}
                </h2>
                <div className="space-y-3.5">
                  {items.map((c) => {
                    const timeStart = new Date(c.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    const timeEnd = new Date(c.endTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    const isFull = c._count.bookings >= c.capacity;
                    const isSpecial = !c.templateId;

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleViewClassDetails(c)}
                        className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 pl-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-cyan-500/30 dark:hover:border-cyan-400/20 group overflow-hidden cursor-pointer"
                      >
                        {/* Elegant Left Accent Bar */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl",
                          isFull
                            ? "bg-red-400"
                            : isSpecial
                              ? "bg-gradient-to-b from-amber-400 to-orange-500"
                              : "bg-gradient-to-b from-cyan-400 to-primary"
                        )} />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-black text-slate-955 dark:text-white text-lg tracking-tight group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors">
                                {c.name}
                              </h3>
                              <span className={cn(
                                "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                                isFull 
                                  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" 
                                  : "bg-cyan-100 dark:bg-cyan-955/30 text-primary dark:text-cyan-400"
                              )}>
                                {c._count.bookings} / {c.capacity} plazas
                              </span>
                              {isSpecial ? (
                                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200 dark:border-amber-900/30">
                                  Especial
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Recurrente
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                {timeStart} - {timeEnd}
                              </span>
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <UserIcon className="h-3.5 w-3.5 text-violet-500" />
                                {c.instructor}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleCancelClass(c.id)}
                              disabled={deletingId === c.id}
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/30 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all cursor-pointer disabled:opacity-50"
                              title="Cancelar esta clase"
                            >
                              {deletingId === c.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : selectedDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No hay clases para este día</h3>
              <p className="text-slate-500 max-w-sm mb-4">
                No hay ninguna actividad programada para la fecha seleccionada.
              </p>
              <button
                onClick={() => setSelectedDate("")}
                className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all"
              >
                Ver todas las clases
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Sin clases programadas</h3>
              <p className="text-slate-500 max-w-sm">
                Crea plantillas semanales o añade un evento especial para llenar el calendario.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* TEMPLATES TAB */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Día</th>
                  <th className="px-6 py-3">Clase</th>
                  <th className="px-6 py-3">Instructor</th>
                  <th className="px-6 py-3">Hora y Duración</th>
                  <th className="px-6 py-3">Aforo</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {templates.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-500">No hay plantillas configuradas</td></tr>
                ) : templates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-primary dark:text-cyan-400">{DAYS[t.dayOfWeek - 1]}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.instructor}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{t.startTime}</p>
                      <p className="text-xs text-slate-500">{t.durationMinutes} min</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{t.capacity} plazas</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteTemplate(t.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Class / Special Event Modal */}
      {isSingleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Añadir Clase Suelta (Evento Especial)</h3>
              <button onClick={() => setIsSingleFormOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSingleClass} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Evento</label>
                <input required type="text" value={singleClassFormData.name} onChange={(e) => setSingleClassFormData({...singleClassFormData, name: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instructor</label>
                  <input required type="text" value={singleClassFormData.instructor} onChange={(e) => setSingleClassFormData({...singleClassFormData, instructor: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aforo Máximo</label>
                  <input required type="number" min="1" value={singleClassFormData.capacity} onChange={(e) => setSingleClassFormData({...singleClassFormData, capacity: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha del Evento</label>
                <input required type="date" value={singleClassFormData.date} onChange={(e) => setSingleClassFormData({...singleClassFormData, date: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora Inicio</label>
                  <input required type="time" value={singleClassFormData.startTime} onChange={(e) => setSingleClassFormData({...singleClassFormData, startTime: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora Fin</label>
                  <input required type="time" value={singleClassFormData.endTime} onChange={(e) => setSingleClassFormData({...singleClassFormData, endTime: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
              </div>

              {error && <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-3xl border border-red-200 dark:border-red-800">{error}</div>}
              
              <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 rounded-3xl bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary text-white py-3 font-semibold transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear Evento"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Template Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Plantilla Semanal</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la Clase</label>
                <input required type="text" value={templateFormData.name} onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instructor</label>
                  <input required type="text" value={templateFormData.instructor} onChange={(e) => setTemplateFormData({...templateFormData, instructor: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aforo Máximo</label>
                  <input required type="number" min="1" value={templateFormData.capacity} onChange={(e) => setTemplateFormData({...templateFormData, capacity: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Día de la Semana</label>
                <select value={templateFormData.dayOfWeek} onChange={(e) => setTemplateFormData({...templateFormData, dayOfWeek: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                  {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora Inicio</label>
                  <input required type="time" value={templateFormData.startTime} onChange={(e) => setTemplateFormData({...templateFormData, startTime: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duración (min)</label>
                  <input required type="number" min="1" value={templateFormData.durationMinutes} onChange={(e) => setTemplateFormData({...templateFormData, durationMinutes: e.target.value})} className="w-full rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none" />
                </div>
              </div>

              {error && <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-3xl border border-red-200 dark:border-red-800">{error}</div>}
              
              <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 rounded-3xl bg-primary hover:bg-primary text-white py-3 font-semibold transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Plantilla"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Class Bookings Roster Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Roster: {selectedClass.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(selectedClass.startTime).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} | {new Date(selectedClass.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button onClick={() => setSelectedClass(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isBookingsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-slate-500">Cargando inscritos...</p>
                </div>
              ) : classBookings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <p className="text-slate-500">No hay reservas para esta clase todavía.</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Estado Cuota</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {classBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{booking.user.name}</p>
                            <p className="text-xs text-slate-500">{booking.user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-full",
                              booking.user.subscriptionStatus === "ACTIVE" 
                                ? "bg-cyan-100 text-primary dark:bg-cyan-900/30 dark:text-cyan-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              {booking.user.subscriptionStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleCancelBooking(booking.id, selectedClass.id)}
                              disabled={isCancelingBookingId === booking.id}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors disabled:opacity-50"
                              title="Liberar plaza"
                            >
                              {isCancelingBookingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-sm text-slate-500">
              <span>Aforo: {classBookings.length} / {selectedClass.capacity}</span>
              <button onClick={() => setSelectedClass(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-2xl font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 flex items-center gap-2 rounded-3xl px-4 py-3 shadow-2xl z-50 text-sm font-medium border",
          toast.type === "ok"
            ? "bg-primary text-white border-cyan-700"
            : "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/10 p-1 rounded-2xl"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
