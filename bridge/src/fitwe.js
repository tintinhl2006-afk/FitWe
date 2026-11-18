/**
 * Cliente de la API de FitWe. Inicia sesión con la cuenta del gimnasio (/api/auth/mobile-login, la
 * misma que usa la app móvil), guarda el token y lo renueva solo si el servidor lo rechaza (401).
 */
function createFitweClient({ url, email, password, fetchImpl = fetch, timeoutMs = 10000 }) {
  const base = url.replace(/\/+$/, "");
  let token = null;

  async function postJson(path, body, headers = {}) {
    return fetchImpl(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  async function login() {
    const res = await postJson("/api/auth/mobile-login", { email, password });
    if (res.status === 429) throw new Error("FitWe limitó los intentos de inicio de sesión; espera unos minutos");
    if (!res.ok) throw new Error(`No se pudo iniciar sesión en FitWe (HTTP ${res.status}); revisa el correo y la contraseña`);
    const data = await res.json();
    if (!data.token) throw new Error("FitWe no devolvió token de sesión");
    if (data.user && data.user.role !== "GYM") throw new Error("La cuenta configurada no es de tipo gimnasio");
    token = data.token;
  }

  /** Valida un QR de acceso. Devuelve la respuesta de FitWe: { status: "GRANTED"|"DENIED", message, reason, client }. */
  async function validate(qrToken, direction) {
    if (!token) await login();
    const type = direction === "exit" ? "exit" : "entry";
    let res = await postJson("/api/admin-gym/access", { token: qrToken, type }, { Authorization: `Bearer ${token}` });
    if (res.status === 401) {
      await login();
      res = await postJson("/api/admin-gym/access", { token: qrToken, type }, { Authorization: `Bearer ${token}` });
    }
    if (!res.ok) throw new Error(`FitWe respondió HTTP ${res.status} al validar el código`);
    return res.json();
  }

  return { login, validate };
}

module.exports = { createFitweClient };
