"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CreditCard, Calendar, Receipt, Download } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
  invoiceNumber?: string | null;
}

interface ClientProfile {
  name: string;
  lastName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  documentLetter: string;
  address: string;
  postalCode: string;
  province: string;
  locality: string;
}

interface GymProfile {
  name: string;
  email: string;
  documentType: string;
  documentNumber: string;
  documentLetter: string;
  phone: string;
  address: string;
  country: string;
  province: string;
  locality: string;
  postalCode: string;
}

export default function PagosPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [gym, setGym] = useState<GymProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/user/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setClient(data.client || null);
        setGym(data.gym || null);
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

  const handleDownloadInvoice = async (payment: PaymentRecord) => {
    if (!client) {
      alert("Error: Datos de cliente no disponibles para la factura.");
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const width = page.getWidth();
      const height = page.getHeight();

      // ── HEADER BACKGROUND / TOP DECORATION ──
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: rgb(0.02, 0.06, 0.13), // Deep Navy
      });

      // Logo / Title
      page.drawText("FitWe", {
        x: 40,
        y: height - 60,
        size: 24,
        font: fontBold,
        color: rgb(0.06, 0.71, 0.85), // Cyan/Teal Accent
      });

      page.drawText("FACTURA DE ABONO", {
        x: 40,
        y: height - 85,
        size: 11,
        font: fontRegular,
        color: rgb(0.7, 0.8, 0.9),
      });

      // Invoice Metadata (Right side)
      const invNumber = payment.invoiceNumber
        ? `Nº Factura: ${payment.invoiceNumber}`
        : `Nº Factura: F-${payment.id.slice(0, 8).toUpperCase()}`;
      const invDate = `Fecha: ${new Date(payment.date).toLocaleDateString("es-ES")}`;
      const invPayMethod = "Método de Pago: Tarjeta Bancaria";

      page.drawText(invNumber, { x: 380, y: height - 50, size: 10, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText(invDate, { x: 380, y: height - 70, size: 10, font: fontRegular, color: rgb(1, 1, 1) });
      page.drawText(invPayMethod, { x: 380, y: height - 90, size: 10, font: fontRegular, color: rgb(1, 1, 1) });

      let yPos = height - 160;

      // ── EMITTER & RECIPIENT COLUMNS ──
      // Emitter (Gym) Info
      page.drawText("DATOS DEL EMISOR", { x: 40, y: yPos, size: 10, font: fontBold, color: rgb(0.03, 0.45, 0.54) });
      page.drawText(gym?.name || "Gimnasio FitWe", { x: 40, y: yPos - 20, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      
      let gymDocStr = "";
      if (gym?.documentNumber) {
        gymDocStr = `${gym.documentType || "NIF"}: ${gym.documentNumber}${gym.documentLetter || ""}`;
      }
      page.drawText(gymDocStr || "NIF: N/A", { x: 40, y: yPos - 35, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(gym?.address || "Dirección no disponible", { x: 40, y: yPos - 50, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      
      let gymLocalityStr = "";
      if (gym?.postalCode || gym?.locality || gym?.province) {
        gymLocalityStr = `${gym.postalCode || ""} ${gym.locality || ""}, ${gym.province || ""}`;
      }
      page.drawText(gymLocalityStr, { x: 40, y: yPos - 65, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(`Tel: ${gym?.phone || "N/A"}`, { x: 40, y: yPos - 80, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(`Email: ${gym?.email || "N/A"}`, { x: 40, y: yPos - 95, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

      // Recipient (Client) Info
      page.drawText("DATOS DEL CLIENTE", { x: 320, y: yPos, size: 10, font: fontBold, color: rgb(0.03, 0.45, 0.54) });
      page.drawText(`${client.name} ${client.lastName}`, { x: 320, y: yPos - 20, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      
      let clientDocStr = "";
      if (client.documentNumber) {
        clientDocStr = `${client.documentType || "NIF"}: ${client.documentNumber}${client.documentLetter || ""}`;
      }
      page.drawText(clientDocStr || "NIF: N/A", { x: 320, y: yPos - 35, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(client.address || "Dirección no indicada", { x: 320, y: yPos - 50, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      
      let clientLocalityStr = "";
      if (client.postalCode || client.locality || client.province) {
        clientLocalityStr = `${client.postalCode || ""} ${client.locality || ""}, ${client.province || ""}`;
      }
      page.drawText(clientLocalityStr, { x: 320, y: yPos - 65, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(`Email: ${client.email}`, { x: 320, y: yPos - 80, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

      yPos = yPos - 140;

      // ── TABLE HEADERS ──
      page.drawRectangle({
        x: 40,
        y: yPos,
        width: width - 80,
        height: 25,
        color: rgb(0.95, 0.96, 0.98),
      });

      page.drawText("Concepto / Servicio", { x: 50, y: yPos + 7, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      page.drawText("Importe", { x: 480, y: yPos + 7, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

      // Table Row
      yPos = yPos - 30;
      page.drawText(payment.description || "Cuota de Suscripción", { x: 50, y: yPos + 5, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`${payment.amount.toFixed(2)} €`, { x: 480, y: yPos + 5, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

      // Divider
      page.drawLine({
        start: { x: 40, y: yPos - 10 },
        end: { x: width - 40, y: yPos - 10 },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });

      yPos = yPos - 40;

      // ── TOTALS ──
      const totalAmount = payment.amount;
      const baseImponible = totalAmount / 1.21;
      const ivaAmount = totalAmount - baseImponible;

      page.drawText("Base Imponible:", { x: 350, y: yPos, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`${baseImponible.toFixed(2)} €`, { x: 480, y: yPos, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

      page.drawText("I.V.A. (21%):", { x: 350, y: yPos - 20, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`${ivaAmount.toFixed(2)} €`, { x: 480, y: yPos - 20, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

      page.drawLine({
        start: { x: 350, y: yPos - 30 },
        end: { x: width - 40, y: yPos - 30 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Total Factura:", { x: 350, y: yPos - 50, size: 11, font: fontBold, color: rgb(0.02, 0.06, 0.13) });
      page.drawText(`${totalAmount.toFixed(2)} €`, { x: 480, y: yPos - 50, size: 12, font: fontBold, color: rgb(0.02, 0.06, 0.13) });

      // ── FOOTER ──
      page.drawText(`Este documento es una factura simplificada emitida por FitWe en nombre y representación de ${gym?.name || "Gimnasio"}.`, {
        x: 40,
        y: 50,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();
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
