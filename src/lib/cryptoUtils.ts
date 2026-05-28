import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret_key_for_development_purposes";

/**
 * Genera un token de acceso firmado digitalmente para un usuario.
 * El token incluye el ID de usuario y la marca de tiempo (timestamp) de generación,
 * lo que permite implementar políticas de expiración en tiempo real.
 */
export function generateAccessCode(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  
  // Generar firma HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
    
  // Codificar payload y firma juntos en Base64 para facilitar su lectura en QR
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

/**
 * Verifica la autenticidad e integridad de un token de acceso.
 * Utiliza comparación en tiempo constante para mitigar ataques de temporización (timing attacks).
 */
export function verifyAccessCode(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [userId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) {
      return null;
    }
    
    const payload = `${userId}:${timestamp}`;
    
    // Re-computar firma esperada
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
      
    // Comparación segura en tiempo constante para mitigar ataques de canal lateral
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }
    
    const isAuthentic = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isAuthentic) {
      return null;
    }
    
    return { userId, timestamp };
  } catch (error) {
    console.error("Error al verificar código de acceso:", error);
    return null;
  }
}
