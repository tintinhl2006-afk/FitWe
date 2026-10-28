import crypto from "crypto";

// No 0/O or 1/I: the code is read aloud and typed by hand. 32^6 is about 1.07 billion codes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * The gym code is the only secret that lets someone join a gym, so it comes from the system's
 * cryptographic generator. It used to be Math.random(), which is not meant for secrets.
 */
export function generateGymCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return code;
}
