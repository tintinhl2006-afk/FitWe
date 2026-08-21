"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CreditCard, Calendar, Receipt, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateInvoicePdf,
  type InvoicePayment as PaymentRecord,
  type InvoiceClient as ClientProfile,
  type InvoiceGym as GymProfile,
} from "@/lib/generateInvoicePdf";

interface PaymentWithGym extends PaymentRecord {
  gym: GymProfile;
}

export default function PagosPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentWithGym[]>([]);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/user/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setClient(data.client || null);
      }
    } catch (e) {
      console.error("Error fetching payments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDownloadInvoice = async (payment: PaymentWithGym) => {
    if (!client) {
      alert("Error: Datos de cliente no disponibles para la factura.");
      return;
    }

    try {
      const pdfBytes = await generateInvoicePdf(payment, client, payment.gym);
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `factura_${payment.id}.pdf`;
      link.click();
    } catch (err) {
      console.error("Error generating invoice PDF:", err);
      alert("Error al generar el PDF de la factura");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Active plan overview info
  const latestPayment = payments[0];
  const activePlanName = latestPayment?.description || "Plan Mensual Activo";
  const activePlanFee = latestPayment?.amount || session?.user?.monthlyFee || 49.99;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pagos y Facturación</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Visualiza tu plan actual, tu historial de transacciones y descarga tus facturas oficiales.
        </p>
      </div>

      {/* Subscription Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plan card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-5 flex items-start gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/30 text-primary shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Cuota de Socio
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
              {activePlanName}
            </span>
            <span className="text-sm font-bold text-primary dark:text-cyan-400 mt-1 block">
              {activePlanFee.toFixed(2)} € / mes
            </span>
          </div>
        </div>

        {/* Expiry card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-5 flex items-start gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/30 text-primary shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Estado del Acceso
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
              {session?.user?.subscriptionEndDate && new Date(session.user.subscriptionEndDate) > new Date()
                ? "Activo"
                : "Expirado"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-450 mt-1 block">
              {session?.user?.subscriptionEndDate ? (
                <>Vence el {new Date(session.user.subscriptionEndDate).toLocaleDateString("es-ES")}</>
              ) : (
                <>Pendiente de activación</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Historial de Recibos y Facturas
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nº Factura</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                      {p.invoiceNumber || `F-${p.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-white">
                      {p.description}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-950 dark:text-white">
                      {p.amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadInvoice(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-cyan-400 hover:underline hover:text-cyan-600 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-sm text-slate-405">
                    No se han registrado pagos para tu cuenta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
