/**
 * Lectores de QR USB en modo "teclado" (p. ej. el R36): escriben el código tecla a tecla, muy rápido,
 * y terminan con Enter. Envían los códigos de tecla del teclado inglés, así que con la distribución
 * española de Windows la tecla "=" sale como "¡" (el relleno "==" del base64 llega como "¡¡").
 */

/** Un humano no teclea con menos de unos 100 ms entre pulsaciones; un lector, con 1-30 ms. */
export const SCANNER_MAX_KEY_GAP_MS = 100;

/** El token de acceso mide ~156 caracteres; cualquier ráfaga más corta no es un QR de FitWe. */
export const SCANNER_MIN_LENGTH = 40;

const TOKEN_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Convierte lo tecleado por el lector en el token base64 original, o devuelve null si la ráfaga
 * no tiene aspecto de token (demasiado corta, o con caracteres que no existen en base64).
 */
export function normalizeScannerToken(raw: string): string | null {
  const token = raw.trim().replace(/¡/g, "=");
  if (token.length < SCANNER_MIN_LENGTH) return null;
  return TOKEN_PATTERN.test(token) ? token : null;
}

/**
 * Acumula pulsaciones y avisa cuando una ráfaga rápida termina en Enter. Separado de React para
 * poder probarlo: se alimenta con (tecla, instante en ms) y devuelve el texto de la ráfaga al Enter.
 */
export function createScannerBuffer(maxGapMs: number = SCANNER_MAX_KEY_GAP_MS) {
  let buffer = "";
  let lastAt = 0;

  return {
    /** Devuelve la ráfaga acumulada cuando llega Enter, y null en cualquier otro caso. */
    push(key: string, at: number): string | null {
      if (at - lastAt > maxGapMs) buffer = "";
      lastAt = at;

      if (key === "Enter") {
        const burst = buffer;
        buffer = "";
        return burst;
      }
      if (key.length === 1) buffer += key;
      return null;
    },
    reset() {
      buffer = "";
    },
  };
}
