/**
 * Lo que ocurre con cada lectura del lector: limpiar → evitar duplicados → validar en FitWe →
 * si lo permite, abrir la puerta en la controladora. Sin nada de hardware aquí dentro, para poder
 * probarlo entero con servidores falsos.
 */
const { normalizeToken, createDeduper } = require("./scanner");

/**
 * Resultados posibles de handleScan:
 *  - IGNORED            lo leído no es un QR de acceso, o es el mismo código repetido enseguida
 *  - DENIED             FitWe no lo permite (cuota, caducado, ya usado...)
 *  - OPENED             FitWe lo permite y la controladora abrió la puerta
 *  - GRANTED_NOT_OPENED FitWe lo permite pero la controladora NO abrió (hay que actuar en recepción)
 *  - ERROR              no se pudo hablar con FitWe (sin red, sesión, etc.)
 */
function createBridge({ fitwe, controller, log = console, now = Date.now, dedupeMs = 5000 }) {
  const isDuplicate = createDeduper(dedupeMs, now);

  return {
    async handleScan(reader, rawLine) {
      const token = normalizeToken(rawLine);
      if (!token) {
        log.warn(`[${reader.name}] lectura ignorada (no es un QR de acceso de FitWe)`);
        return { outcome: "IGNORED", reason: "NOT_A_TOKEN" };
      }
      if (isDuplicate(token)) return { outcome: "IGNORED", reason: "DUPLICATE" };

      let result;
      try {
        result = await fitwe.validate(token, reader.direction);
      } catch (err) {
        log.error(`[${reader.name}] no se pudo validar con FitWe: ${err.message}`);
        return { outcome: "ERROR", error: err.message };
      }

      const who = result.client ? result.client.name : "desconocido";
      if (result.status !== "GRANTED") {
        log.info(`[${reader.name}] DENEGADO (${result.reason || "sin motivo"}): ${who} — ${result.message}`);
        return { outcome: "DENIED", reason: result.reason, message: result.message, client: result.client };
      }

      try {
        await controller.openDoor(reader.door);
      } catch (err) {
        // El acceso ya quedó concedido y registrado en FitWe (y, en bonos, el crédito descontado).
        log.error(
          `[${reader.name}] ⚠ PERMITIDO a ${who} pero NO se pudo abrir la puerta ${reader.door}: ${err.message}. ` +
            `Ábrela a mano y revisa la controladora.`
        );
        return { outcome: "GRANTED_NOT_OPENED", error: err.message, client: result.client };
      }

      log.info(`[${reader.name}] PERMITIDO ${reader.direction === "exit" ? "(salida)" : "(entrada)"}: ${who} — puerta ${reader.door} abierta`);
      return { outcome: "OPENED", client: result.client };
    },
  };
}

module.exports = { createBridge };
