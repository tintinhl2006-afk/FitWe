import crypto from "crypto";

/**
 * The one place that reads NEXTAUTH_SECRET. Throws instead of silently falling back to a
 * hardcoded default — a missing env var must never let auth/session tokens or gym-access QR
 * codes be signed with a secret an attacker can read straight out of this repo.
 */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET no está configurada. La aplicación no puede firmar ni verificar tokens de forma segura sin ella."
    );
  }
  return secret;
}

/**
 * Domain-separated secret for the gym-access QR codes, derived from NEXTAUTH_SECRET rather
 * than reusing it directly — so a future bug/leak in one system (e.g. QR access codes, which
 * are handed out far more widely and rendered as scannable images) can never be used to forge
 * the other (login session/mobile bearer tokens).
 */
export function getAccessTokenSecret(): string {
  return crypto.createHmac("sha256", getAuthSecret()).update("fitwe-access-token-v1").digest("hex");
}
