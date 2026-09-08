"use client";

import { useState, useEffect } from "react";
import { Loader2, Receipt, Download, Search, Eye, ChevronLeft, ChevronRight, FileSpreadsheet, Undo2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateInvoicePdf,
  type InvoiceGym as GymProfile,
} from "@/lib/generateInvoicePdf";

interface InvoiceClient {
  name: string;
  lastName: string | null;
  email: string;
  documentType: string | null;
  documentNumber: string | null;
  documentLetter: string | null;
  address: string | null;
  postalCode: string | null;
  province: string | null;
  locality: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  description: string;
  vatRate: number | null;
  source: "ONLINE" | "CASH" | null;
  date: string;
  invoiceNumber: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  user: InvoiceClient;
  gym: GymProfile;
}

interface PaymentMethodOption {
  id: string;
  billingName: string;
  gateway: "STRIPE" | "REDSYS";
  isActive: boolean;
}

const PAGE_SIZE = 20;

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Invoice | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [revokeAccess, setRevokeAccess] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  // Debounce search input before hitting the server
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (paymentMethodFilter) params.set("paymentMethodId", paymentMethodFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const res = await fetch(`/api/admin-gym/invoices?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.payments || []);
          setTotal(data.total ?? 0);
          if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        }
      } catch (e) {
        console.error("Error fetching gym invoices:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, [page, debouncedSearch, paymentMethodFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (paymentMethodFilter) params.set("paymentMethodId", paymentMethodFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/admin-gym/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `facturas_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting invoices to CSV:", err);
      alert("Error al exportar las facturas");
    } finally {
      setIsExporting(false);
    }
  };

  const buildInvoiceBlobUrl = async (invoice: Invoice) => {
    const pdfBytes = await generateInvoicePdf(
      invoice,
      {
        name: invoice.user.name,
        lastName: invoice.user.lastName || "",
        email: invoice.user.email,
        documentType: invoice.user.documentType || "",
        documentNumber: invoice.user.documentNumber || "",
        documentLetter: invoice.user.documentLetter || "",
        address: invoice.user.address || "",
        postalCode: invoice.user.postalCode || "",
        province: invoice.user.province || "",
        locality: invoice.user.locality || "",
      },
      invoice.gym
    );
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const url = await buildInvoiceBlobUrl(invoice);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error generating invoice PDF:", err);
      alert("Error al generar el PDF de la factura");
    }
  };

  const openRefundModal = (invoice: Invoice) => {
    setRefundTarget(invoice);
    setRefundReason("");
    setRevokeAccess(false);
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget) return;
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin-gym/payments/${refundTarget.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason, revokeAccess }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al registrar el reembolso");
      }
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === refundTarget.id ? { ...inv, refundedAt: new Date().toISOString(), refundReason } : inv
        )
      );
      setRefundTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar el reembolso");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const url = await buildInvoiceBlobUrl(invoice);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura_${invoice.id}.pdf`;
      link.click();
    } catch (err) {
      console.error("Error generating invoice PDF:", err);
      alert("Error al generar el PDF de la factura");
    }
  };

  if (isLoading && invoices.length === 0) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Facturación</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Consulta y descarga las facturas emitidas a tus clientes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Facturas Emitidas
              </h3>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Exportar CSV
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-56 py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos los métodos de pago</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.billingName}
                  {m.isActive ? " (activo)" : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40 py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-xs text-slate-400 shrink-0">a</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-40 py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="relative w-full sm:flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, email o nº factura..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nº Factura</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Método de Pago</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                      {inv.invoiceNumber || `F-${inv.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                      {inv.user.name} {inv.user.lastName || ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{inv.description}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            inv.source === "CASH"
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                              : "bg-cyan-50 dark:bg-cyan-950/30 text-primary dark:text-cyan-400"
                          )}
                        >
                          {inv.source === "CASH" ? "Efectivo" : "Online"}
                        </span>
                        {inv.refundedAt && (
                          <span
                            title={inv.refundReason || undefined}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                          >
                            Reembolsada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {inv.paymentMethodName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-950 dark:text-white">
                      {inv.amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-4">
                        <button
                          onClick={() => handleViewInvoice(inv)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-cyan-400 hover:underline hover:text-cyan-600 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Descargar</span>
                        </button>
                        {!inv.refundedAt && (
                          <button
                            onClick={() => openRefundModal(inv)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:underline hover:text-red-600 cursor-pointer"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Reembolsar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-405">
                    {debouncedSearch || paymentMethodFilter
                      ? "No se encontraron facturas que coincidan con los filtros aplicados."
                      : "No se han registrado facturas todavía."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
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
              disabled={page >= totalPages || isLoading}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Marcar factura como reembolsada
              </h3>
              <button onClick={() => setRefundTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Factura <strong className="text-slate-900 dark:text-white">{refundTarget.invoiceNumber}</strong> de{" "}
                <strong className="text-slate-900 dark:text-white">
                  {refundTarget.user.name} {refundTarget.user.lastName || ""}
                </strong>{" "}
                por <strong className="text-slate-900 dark:text-white">{refundTarget.amount.toFixed(2)} €</strong>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esto no borra la factura (queda como registro fiscal) — la marca visiblemente como reembolsada
                tanto en este listado como en el PDF. El reembolso en sí (devolver el dinero) tienes que hacerlo
                desde tu propia cuenta de Stripe/Redsys; esto solo lo refleja en FitWe.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Motivo (opcional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej. Cliente insatisfecho, error de cobro..."
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeAccess}
                  onChange={(e) => setRevokeAccess(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500/30"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Además, desactivar el acceso del cliente ahora mismo (no espera a que caduque su cuota).
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setRefundTarget(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 text-sm font-bold text-white cursor-pointer transition-colors"
              >
                {isRefunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                Confirmar reembolso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
