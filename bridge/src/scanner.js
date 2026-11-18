/**
 * Utilidades para lo que escribe el lector de QR por el puerto serie.
 *
 * Es la misma lógica que src/lib/scannerInput.ts de la web (este programa es un paquete aparte):
 * el token de acceso es base64 de ~156 caracteres. Se acepta "¡" como "=" por si el lector se
 * usara en modo teclado con distribución española.
 */

const MIN_LENGTH = 40;
const TOKEN_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/** Devuelve el token base64 limpio, o null si lo recibido no parece un QR de acceso de FitWe. */
function normalizeToken(raw) {
  const token = String(raw).trim().replace(/¡/g, "=");
  if (token.length < MIN_LENGTH) return null;
  return TOKEN_PATTERN.test(token) ? token : null;
}

/** Trocea el flujo de bytes del puerto serie en líneas (el lector termina cada lectura con CR y/o LF). */
function createLineSplitter(onLine) {
  let pending = "";
  return (chunk) => {
    pending += chunk.toString("utf8");
    const parts = pending.split(/\r\n|\r|\n/);
    pending = parts.pop(); // lo último puede ser una línea a medias
    for (const line of parts) if (line.length > 0) onLine(line);
  };
}

/** Ignora el mismo código si vuelve a llegar dentro de la ventana (por defecto 5 s). */
function createDeduper(windowMs = 5000, now = Date.now) {
  let last = null;
  let lastAt = 0;
  return (token) => {
    const t = now();
    if (token === last && t - lastAt < windowMs) return true;
    last = token;
    lastAt = t;
    return false;
  };
}

module.exports = { normalizeToken, createLineSplitter, createDeduper, MIN_LENGTH };
