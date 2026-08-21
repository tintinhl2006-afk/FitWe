import crypto from "crypto";

/**
 * FUC público del comercio de pruebas oficial de Redsys (entorno sandbox
 * sis-t.redsys.es), el mismo que se documenta en cualquier guía de integración.
 * No mueve dinero real, así que no debe tratarse como una pasarela "real" a
 * efectos de bloquear los pagos simulados internos de la app.
 */
export const REDSYS_TEST_MERCHANT_CODE = "999008881";

export function isRedsysTestMerchant(fuc: string | null | undefined): boolean {
  return (fuc || "").trim() === REDSYS_TEST_MERCHANT_CODE;
}

/**
 * Genera la clave de encriptación Triple DES (3DES) para Redsys
 * en base al número de orden y la clave del comercio.
 */
function get3DESKey(order: string, base64Key: string): Buffer {
  const keyBuffer = Buffer.from(base64Key, "base64");
  
  // Vector de inicialización (IV) de 8 bytes rellenos a cero, requerido por Redsys
  const iv = Buffer.alloc(8, 0);
  
  // Relleno manual con bytes nulos (ceros) para que la longitud sea múltiplo de 8
  let orderBuffer = Buffer.from(order, "utf8");
  const padLength = 8 - (orderBuffer.length % 8);
  if (padLength !== 8) {
    const pad = Buffer.alloc(padLength, 0);
    orderBuffer = Buffer.concat([orderBuffer, pad]);
  }
  
  // Redsys utiliza el algoritmo Triple DES (des-ede3-cbc) para cifrar el número de orden
  const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, iv);
  
  // ESENCIAL: Deshabilitar el relleno automático (PKCS#7) de Node y usar el manual a ceros de Redsys
  cipher.setAutoPadding(false);
  
  let encrypted = cipher.update(orderBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return encrypted;
}

/**
 * Genera la firma Ds_Signature y los parámetros Ds_MerchantParameters requeridos por Redsys
 * para redireccionar al cliente a la pasarela de pago.
 */
export function generateMerchantSignature({
  params,
  redsysClave,
}: {
  params: Record<string, any>;
  redsysClave: string;
}): { merchantParameters: string; signature: string } {
  // Convertir los parámetros en JSON y luego a Base64
  const jsonStr = JSON.stringify(params);
  const merchantParameters = Buffer.from(jsonStr, "utf8").toString("base64");
  
  // Obtener el número de orden
  const order = params.DS_MERCHANT_ORDER || params.Ds_Merchant_Order || "";
  
  // Generar la clave de firma HMAC usando 3DES sobre la orden
  const keyHMAC = get3DESKey(order, redsysClave);
  
  // Calcular la firma digital HMAC-SHA-256 de los parámetros Base64
  const signatureBuffer = crypto
    .createHmac("sha256", keyHMAC)
    .update(merchantParameters)
    .digest();
    
  // Convertir la firma en formato Base64 estándar
  const signature = signatureBuffer.toString("base64");
  
  return {
    merchantParameters,
    signature,
  };
}

/**
 * Verifica la firma recibida de una llamada de notificación (webhook) de Redsys
 * para certificar que el pago es auténtico y procede del banco.
 */
export function verifyCallbackSignature({
  merchantParametersB64,
  signatureReceived,
  order,
  redsysClave,
}: {
  merchantParametersB64: string;
  signatureReceived: string;
  order: string;
  redsysClave: string;
}): boolean {
  try {
    const keyHMAC = get3DESKey(order, redsysClave);
    
    const signatureBuffer = crypto
      .createHmac("sha256", keyHMAC)
      .update(merchantParametersB64)
      .digest();
      
    // Redsys en el webhook de respuesta suele enviar la firma en formato Base64url.
    // Damos soporte robusto tanto a base64url como a base64 estándar reemplazando caracteres de control.
    const sigBase64 = signatureBuffer.toString("base64");
    const sigBase64Url = signatureBuffer.toString("base64url");
    
    // Normalizar firmas eliminando rellenos '=' y mapeando caracteres
    const normalizedReceived = signatureReceived
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/=+$/, "");
      
    const normalizedSig = sigBase64.replace(/=+$/, "");
    
    return normalizedSig === normalizedReceived || sigBase64Url === signatureReceived;
  } catch (e) {
    console.error("Error verifying Redsys callback signature:", e);
    return false;
  }
}
