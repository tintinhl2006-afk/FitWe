/**
 * Signed, expiring links for the simulated payment terminal.
 *
 * /dashboard/pago is exempt from the session gate (the gateway's return trip and the mobile
 * WebView carry no cookie), which also exposed the bank-branded mock terminal to anyone with a
 * URL and an attacker-chosen amount. In production the terminal now only opens with a signature
 * issued by POST /api/user/payment for that exact amount and plan.
 *
 * Uses Web Crypto so the same code runs in the middleware and in route handlers.
 */
const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signingKey(): Promise<CryptoKey> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no está configurada.");
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const derived = await crypto.subtle.sign("HMAC", base, encoder.encode("fitwe-mock-link-v1"));
  return crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function mac(amount: string, planId: string, exp: string): Promise<string> {
  const key = await signingKey();
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${amount}|${planId}|${exp}`)));
}

export async function signMockLink(
  amount: string,
  planId: string,
  ttlMs = 10 * 60 * 1000
): Promise<{ exp: string; sig: string }> {
  const exp = String(Date.now() + ttlMs);
  return { exp, sig: await mac(amount, planId, exp) };
}

export async function verifyMockLink(
  amount: string | null,
  planId: string | null,
  exp: string | null,
  sig: string | null
): Promise<boolean> {
  if (!amount || !exp || !sig) return false;
  if (!/^\d{10,16}$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await mac(amount, planId ?? "", exp);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
