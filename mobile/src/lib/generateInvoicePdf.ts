import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface InvoicePayment {
  id: string;
  amount: number;
  description: string;
  date: string;
  invoiceNumber?: string | null;
  vatRate?: number | null;
  source?: 'ONLINE' | 'CASH' | null;
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

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function docLine(entity: { documentType?: string; documentNumber?: string; documentLetter?: string }) {
  if (!entity.documentNumber) return 'NIF: N/A';
  return `${escapeHtml(entity.documentType || 'NIF')}: ${escapeHtml(entity.documentNumber)}${escapeHtml(entity.documentLetter || '')}`;
}

function localityLine(entity: { postalCode?: string; locality?: string; province?: string }) {
  if (!entity.postalCode && !entity.locality && !entity.province) return '';
  return `${escapeHtml(entity.postalCode || '')} ${escapeHtml(entity.locality || '')}, ${escapeHtml(entity.province || '')}`;
}

/**
 * A factura simplificada (RD 1619/2012, applicable here since gym membership fees are well
 * under the 400€ threshold) only needs the client's fiscal identity (NIF, dirección) when the
 * client actually has one registered, e.g. to deduct IVA — only called in that case.
 */
function clientFiscalLines(client: InvoiceClient) {
  const locality = localityLine(client);
  return `
    <p>${docLine(client)}</p>
    ${client.address ? `<p>${escapeHtml(client.address)}</p>` : ''}
    ${locality ? `<p>${locality}</p>` : ''}
    <p>Email: ${escapeHtml(client.email)}</p>
  `;
}

function buildInvoiceHtml(payment: InvoicePayment, client: InvoiceClient, gym: InvoiceGym | null) {
  const invNumber = payment.invoiceNumber
    ? `Nº Factura: ${escapeHtml(payment.invoiceNumber)}`
    : `Nº Factura: F-${payment.id.slice(0, 8).toUpperCase()}`;
  const invDate = `Fecha: ${new Date(payment.date).toLocaleDateString('es-ES')}`;
  const invPayMethod = `Método de Pago: ${payment.source === 'CASH' ? 'Efectivo' : 'Tarjeta / Pago Online'}`;

  const totalAmount = payment.amount;
  const vatRate = payment.vatRate ?? 21;
  const baseImponible = vatRate > 0 ? totalAmount / (1 + vatRate / 100) : totalAmount;
  const ivaAmount = totalAmount - baseImponible;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; margin: 0; color: #1a1a1a; }
          .header { background: #050f21; color: #fff; padding: 28px 32px; }
          .header .logo { font-size: 22px; font-weight: bold; color: #10b6d9; margin: 0; }
          .header .subtitle { font-size: 11px; color: #b3c4d9; margin: 4px 0 0; }
          .header .meta { position: absolute; top: 28px; right: 32px; text-align: right; font-size: 10px; }
          .wrap { padding: 24px 32px; }
          .columns { display: flex; justify-content: space-between; margin-top: 8px; }
          .col { width: 48%; }
          .col h4 { font-size: 10px; letter-spacing: 0.05em; color: #06738a; margin: 0 0 6px; }
          .col p { font-size: 9.5px; color: #4d4d4d; margin: 2px 0; }
          .col .name { font-size: 12px; font-weight: bold; color: #111; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #f2f4f8; text-align: left; font-size: 9.5px; padding: 10px 8px; color: #333; }
          th.right, td.right { text-align: right; }
          td { font-size: 10.5px; padding: 10px 8px; border-bottom: 1px solid #eee; }
          .totals { width: 260px; margin-left: auto; margin-top: 16px; font-size: 10.5px; }
          .totals .row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
          .totals .total { border-top: 1px solid #ccc; margin-top: 6px; padding-top: 10px; font-size: 13px; font-weight: bold; color: #050f21; }
          .footer { margin-top: 40px; font-size: 8px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header" style="position: relative;">
          <p class="logo">FitWe</p>
          <p class="subtitle">FACTURA DE ABONO</p>
          <div class="meta">
            <div><strong>${invNumber}</strong></div>
            <div>${invDate}</div>
            <div>${invPayMethod}</div>
          </div>
        </div>
        <div class="wrap">
          <div class="columns">
            <div class="col">
              <h4>DATOS DEL EMISOR</h4>
              <p class="name">${escapeHtml(gym?.name || 'Gimnasio FitWe')}</p>
              <p>${docLine(gym || {})}</p>
              <p>${escapeHtml(gym?.address || 'Dirección no disponible')}</p>
              <p>${localityLine(gym || {})}</p>
              <p>Tel: ${escapeHtml(gym?.phone || 'N/A')}</p>
              <p>Email: ${escapeHtml(gym?.email || 'N/A')}</p>
            </div>
            <div class="col">
              <h4>DATOS DEL CLIENTE</h4>
              <p class="name">${escapeHtml(client.name)} ${escapeHtml(client.lastName)}</p>
              ${client.documentNumber ? clientFiscalLines(client) : `<p>Consumidor final</p><p>Email: ${escapeHtml(client.email)}</p>`}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto / Servicio</th>
                <th class="right">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(payment.description || 'Cuota de Suscripción')}</td>
                <td class="right">${totalAmount.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Base Imponible:</span><span>${baseImponible.toFixed(2)} €</span></div>
            <div class="row"><span>I.V.A. (${vatRate}%):</span><span>${ivaAmount.toFixed(2)} €</span></div>
            <div class="row total"><span>Total Factura:</span><span>${totalAmount.toFixed(2)} €</span></div>
          </div>

          <p class="footer">
            Este documento es una factura simplificada emitida por FitWe en nombre y representación de ${escapeHtml(gym?.name || 'Gimnasio')}.
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function downloadAndShareInvoice(
  payment: InvoicePayment,
  client: InvoiceClient,
  gym: InvoiceGym | null
) {
  const html = buildInvoiceHtml(payment, client, gym);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
  return uri;
}
