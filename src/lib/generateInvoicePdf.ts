import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";

/** Greedily wraps text to fit within maxWidth, breaking oversized single words by character. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  const pushLine = (line: string) => {
    if (lines.length < maxLines) lines.push(line);
  };

  for (const word of words) {
    if (lines.length >= maxLines) break;
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      pushLine(currentLine);
      currentLine = "";
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      currentLine = word;
      continue;
    }

    // Single word longer than the column: break it by character.
    let chunk = "";
    for (const char of word) {
      const testChunk = chunk + char;
      if (font.widthOfTextAtSize(testChunk, size) > maxWidth) {
        pushLine(chunk);
        chunk = char;
        if (lines.length >= maxLines) {
          chunk = "";
          break;
        }
      } else {
        chunk = testChunk;
      }
    }
    currentLine = chunk;
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  // Add an ellipsis if content was cut off.
  if (lines.length === maxLines) {
    const lastWordsConsumed = lines.join(" ").length;
    const fullTextLength = text.length;
    if (lastWordsConsumed < fullTextLength - 1) {
      let lastLine = lines[maxLines - 1];
      while (lastLine.length > 0 && font.widthOfTextAtSize(`${lastLine}…`, size) > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      lines[maxLines - 1] = `${lastLine}…`;
    }
  }

  return lines.length ? lines : [""];
}

/** Truncates single-line text with an ellipsis so it never overflows past maxWidth. */
function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  description: string;
  date: string | Date;
  invoiceNumber?: string | null;
  vatRate?: number | null;
  source?: "ONLINE" | "CASH" | null;
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
  const invPayMethod = `Método de Pago: ${payment.source === "CASH" ? "Efectivo" : "Tarjeta / Pago Online"}`;

  const metaColWidth = width - 40 - 380;
  page.drawText(truncateToWidth(invNumber, fontBold, 10, metaColWidth), { x: 380, y: height - 50, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(truncateToWidth(invDate, fontRegular, 10, metaColWidth), { x: 380, y: height - 70, size: 10, font: fontRegular, color: rgb(1, 1, 1) });
  page.drawText(truncateToWidth(invPayMethod, fontRegular, 10, metaColWidth), { x: 380, y: height - 90, size: 10, font: fontRegular, color: rgb(1, 1, 1) });

  let yPos = height - 160;

  // ── EMITTER & RECIPIENT COLUMNS ──
  // Each column is truncated to its own width so long business names, addresses or emails
  // never bleed into the neighboring column or off the page edge.
  const emitterColWidth = 260; // x=40 up to the recipient column at x=320
  const recipientColWidth = width - 40 - 320; // x=320 up to the right page margin

  // Emitter (Gym) Info
  page.drawText("DATOS DEL EMISOR", { x: 40, y: yPos, size: 10, font: fontBold, color: rgb(0.03, 0.45, 0.54) });
  page.drawText(truncateToWidth(gym?.name || "Gimnasio FitWe", fontBold, 11, emitterColWidth), { x: 40, y: yPos - 20, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  let gymDocStr = "";
  if (gym?.documentNumber) {
    gymDocStr = `${gym.documentType || "NIF"}: ${gym.documentNumber}${gym.documentLetter || ""}`;
  }
  page.drawText(truncateToWidth(gymDocStr || "NIF: N/A", fontRegular, 9, emitterColWidth), { x: 40, y: yPos - 35, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(truncateToWidth(gym?.address || "Dirección no disponible", fontRegular, 9, emitterColWidth), { x: 40, y: yPos - 50, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  let gymLocalityStr = "";
  if (gym?.postalCode || gym?.locality || gym?.province) {
    gymLocalityStr = `${gym.postalCode || ""} ${gym.locality || ""}, ${gym.province || ""}`;
  }
  page.drawText(truncateToWidth(gymLocalityStr, fontRegular, 9, emitterColWidth), { x: 40, y: yPos - 65, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(truncateToWidth(`Tel: ${gym?.phone || "N/A"}`, fontRegular, 9, emitterColWidth), { x: 40, y: yPos - 80, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(truncateToWidth(`Email: ${gym?.email || "N/A"}`, fontRegular, 9, emitterColWidth), { x: 40, y: yPos - 95, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Recipient (Client) Info — a factura simplificada (RD 1619/2012, applicable here since gym
  // membership fees are well under the 400€ threshold) only needs the client's fiscal
  // identity (NIF, dirección) if the client actually has one registered, e.g. to deduct IVA.
  // Otherwise we just show who it's for, without inventing/placeholder-ing missing data.
  const clientHasFiscalData = !!client.documentNumber;
  page.drawText("DATOS DEL CLIENTE", { x: 320, y: yPos, size: 10, font: fontBold, color: rgb(0.03, 0.45, 0.54) });
  page.drawText(truncateToWidth(`${client.name} ${client.lastName}`, fontBold, 11, recipientColWidth), { x: 320, y: yPos - 20, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  if (clientHasFiscalData) {
    const clientDocStr = `${client.documentType || "NIF"}: ${client.documentNumber}${client.documentLetter || ""}`;
    page.drawText(truncateToWidth(clientDocStr, fontRegular, 9, recipientColWidth), { x: 320, y: yPos - 35, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    if (client.address) {
      page.drawText(truncateToWidth(client.address, fontRegular, 9, recipientColWidth), { x: 320, y: yPos - 50, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    }

    let clientLocalityStr = "";
    if (client.postalCode || client.locality || client.province) {
      clientLocalityStr = `${client.postalCode || ""} ${client.locality || ""}, ${client.province || ""}`;
    }
    if (clientLocalityStr) {
      page.drawText(truncateToWidth(clientLocalityStr, fontRegular, 9, recipientColWidth), { x: 320, y: yPos - 65, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    }
    page.drawText(truncateToWidth(`Email: ${client.email}`, fontRegular, 9, recipientColWidth), { x: 320, y: yPos - 80, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  } else {
    page.drawText("Consumidor final", { x: 320, y: yPos - 35, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(truncateToWidth(`Email: ${client.email}`, fontRegular, 9, recipientColWidth), { x: 320, y: yPos - 50, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  }

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

  // Table Row — description column ends well before the "Importe" column (x=480) so long
  // descriptions (e.g. gateway refs) don't run into the amount text.
  yPos = yPos - 30;
  const descLineHeight = 13;
  const descLines = wrapText(payment.description || "Cuota de Suscripción", fontRegular, 10, 400, 3);
  descLines.forEach((line, i) => {
    page.drawText(line, { x: 50, y: yPos + 5 - i * descLineHeight, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
  });
  page.drawText(`${payment.amount.toFixed(2)} €`, { x: 480, y: yPos + 5, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  const rowExtraHeight = (descLines.length - 1) * descLineHeight;

  // Divider
  page.drawLine({
    start: { x: 40, y: yPos - 10 - rowExtraHeight },
    end: { x: width - 40, y: yPos - 10 - rowExtraHeight },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  yPos = yPos - 40 - rowExtraHeight;

  // ── TOTALS ──
  const totalAmount = payment.amount;
  const vatRate = payment.vatRate ?? 21;
  const baseImponible = vatRate > 0 ? totalAmount / (1 + vatRate / 100) : totalAmount;
  const ivaAmount = totalAmount - baseImponible;

  page.drawText("Base Imponible:", { x: 350, y: yPos, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`${baseImponible.toFixed(2)} €`, { x: 480, y: yPos, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  page.drawText(`I.V.A. (${vatRate}%):`, { x: 350, y: yPos - 20, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
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
