import crypto from "crypto";
import { getAuthSecret } from "@/lib/authSecret";

const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";

/**
 * Symmetric-key encryption for secrets that must be stored at rest but aren't needed for
 * lookups/comparisons in SQL (currently: GymPaymentMethod.redsysClave, a per-gym Redsys
 * signing key equivalent to a payment-gateway API secret). Key is derived from NEXTAUTH_SECRET
 * via domain separation (same pattern as `getAccessTokenSecret`), so no extra env var/secret
 * management is needed — but it also means rotating NEXTAUTH_SECRET would make previously
 * encrypted values undecryptable, same tradeoff already accepted for the QR access tokens.
 */
function getEncryptionKey(): Buffer {
  return crypto.createHmac("sha256", getAuthSecret()).update("fitwe-field-encryption-v1").digest();
}

/**
 * Encrypts `plaintext` unless it's empty or the literal "mock" sentinel some routes compare
 * against directly (`redsysClave.toLowerCase() === "mock"`) — that sentinel must stay a
 * plain, recognizable string forever, not ciphertext.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext || plaintext.trim().toLowerCase() === "mock") return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypts a value produced by `encryptSecret`. Tolerant of anything that doesn't look like
 * our ciphertext format (the "mock" sentinel, empty values, or legacy plaintext rows written
 * before this encryption existed) — returns those unchanged rather than throwing, so a mixed
 * DB state (some rows migrated, some not yet) never breaks a live payment.
 */
export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored;

  try {
    const [ivB64, authTagB64, ciphertextB64] = stored.slice(PREFIX.length).split(":");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (error) {
    console.error("Error decrypting field:", error);
    return "";
  }
}
