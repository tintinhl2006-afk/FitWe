import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface InvoicePayment {
  id: string;
  amount: number;
  description: string;
  date: string | Date;
  invoiceNumber?: string | null;
}

export interface InvoiceClient {
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

export interface InvoiceGym {
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

export async function generateInvoicePdf(
  payment: InvoicePayment,
  client: InvoiceClient,
  gym: InvoiceGym | null
): Promise<Uint8Array> {
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

  return pdfDoc.save();
}
