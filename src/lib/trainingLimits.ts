/**
 * Bounds for caller-supplied training numbers. Several routes persisted `sets` straight from the
 * request body, and POST /api/sessions/start then looped that many times building an in-memory
 * array, so one small request could exhaust the function's memory or write millions of rows.
 */
export const MAX_SETS = 50;
export const MAX_REPS = 1000;
export const MAX_WEIGHT = 5000;

/** Returns the value as an integer within [min, max], or null if it is anything else. */
export function boundedInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/** Returns the value as a finite number within [min, max], or null if it is anything else. */
export function boundedNumber(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) return null;
  return n;
}
