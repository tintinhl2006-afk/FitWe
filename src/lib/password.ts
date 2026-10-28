import bcrypt from "bcryptjs";

/**
 * One cost factor for every password hash the app creates. Two routes used 12 and the rest 10;
 * 10 is also what the great majority of hashes already stored use, which matters because the
 * "no such user" path below has to take as long as a real comparison, and a different cost would
 * make the two distinguishable again.
 */
export const BCRYPT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// A real hash of a throwaway value, generated once per process, compared against when the account
// does not exist so that "unknown email" and "wrong password" cost the same time.
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = bcrypt.hash("fitwe-timing-equalisation-value", BCRYPT_ROUNDS);
  return dummyHash;
}

/**
 * Compares a password against a stored hash. When there is no hash (unknown account) it still
 * performs a full bcrypt comparison against a dummy and returns false, so the response time does
 * not reveal whether the email is registered.
 */
export async function verifyPassword(plain: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) {
    await bcrypt.compare(plain, await getDummyHash());
    return false;
  }
  return bcrypt.compare(plain, storedHash);
}
