/**
 * Cliente mínimo de ISAPI (la API HTTP de las controladoras Hikvision) con autenticación digest.
 *
 * IMPORTANTE: la ruta y el XML de "abrir puerta" están tomados de ejemplos de la comunidad con
 * otros dispositivos Hikvision, no de la documentación oficial de la DS-K2602T. Están aislados en
 * las constantes de abajo para ajustarlos el día que la controladora esté encendida
 * (`npm run check` comprueba la conexión y las credenciales antes de intentar abrir nada).
 */
const crypto = require("crypto");

const OPEN_DOOR_PATH = (door) => `/ISAPI/AccessControl/RemoteControl/door/${door}`;
const OPEN_DOOR_BODY =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><cmd>open</cmd></RemoteControlDoor>';
const DEVICE_INFO_PATH = "/ISAPI/System/deviceInfo";

const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");

function parseChallenge(header) {
  const fields = {};
  const re = /(\w+)=(?:"([^"]*)"|([^\s,]+))/g;
  let m;
  while ((m = re.exec(header))) fields[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  return fields;
}

/** Cabecera Authorization digest (RFC 7616, MD5) para responder al desafío 401 del dispositivo. */
function buildDigestHeader({ method, uri, user, password, challenge, nc = 1, cnonce = crypto.randomBytes(8).toString("hex") }) {
  const ncStr = String(nc).padStart(8, "0");
  const qop = challenge.qop ? challenge.qop.split(",").map((q) => q.trim()).find((q) => q === "auth") || null : null;
  const ha1 = md5(`${user}:${challenge.realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = qop
    ? md5(`${ha1}:${challenge.nonce}:${ncStr}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${challenge.nonce}:${ha2}`);

  const parts = [
    `username="${user}"`,
    `realm="${challenge.realm}"`,
    `nonce="${challenge.nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];
  if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`);
  if (qop) parts.push(`qop=${qop}`, `nc=${ncStr}`, `cnonce="${cnonce}"`);
  return `Digest ${parts.join(", ")}`;
}

function createHikvisionClient({ url, user, password, fetchImpl = fetch, timeoutMs = 5000 }) {
  const base = url.replace(/\/+$/, "");

  async function request(method, path, body) {
    const headers = body ? { "Content-Type": "application/xml" } : {};
    const send = (extra) =>
      fetchImpl(base + path, {
        method,
        headers: { ...headers, ...extra },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });

    let res = await send({});
    if (res.status === 401) {
      const header = res.headers.get("www-authenticate") || "";
      if (!/^digest/i.test(header)) throw new Error("La controladora pidió un tipo de autenticación no soportado");
      const challenge = parseChallenge(header);
      res = await send({
        Authorization: buildDigestHeader({ method, uri: path, user, password, challenge }),
      });
      if (res.status === 401) throw new Error("La controladora rechazó el usuario o la contraseña");
    }
    const text = await res.text();
    return { status: res.status, text };
  }

  return {
    /** Manda a la controladora abrir la puerta N (cada sentido del torno es una "puerta"). */
    async openDoor(door) {
      const { status, text } = await request("PUT", OPEN_DOOR_PATH(door), OPEN_DOOR_BODY);
      if (status !== 200) throw new Error(`La controladora respondió HTTP ${status} al abrir la puerta ${door}`);
      // ISAPI devuelve 200 con un <ResponseStatus>; statusCode 1 es "OK".
      const code = /<statusCode>(\d+)<\/statusCode>/.exec(text);
      if (code && code[1] !== "1") {
        const msg = /<statusString>([^<]*)<\/statusString>/.exec(text);
        throw new Error(`La controladora no abrió la puerta ${door}: ${msg ? msg[1] : "statusCode " + code[1]}`);
      }
    },

    /** Comprobación de conexión y credenciales, sin abrir nada. */
    async deviceInfo() {
      const { status, text } = await request("GET", DEVICE_INFO_PATH);
      if (status !== 200) throw new Error(`La controladora respondió HTTP ${status}`);
      const model = /<model>([^<]*)<\/model>/.exec(text);
      return { model: model ? model[1] : "(sin modelo en la respuesta)" };
    },
  };
}

module.exports = { createHikvisionClient, buildDigestHeader, parseChallenge };
