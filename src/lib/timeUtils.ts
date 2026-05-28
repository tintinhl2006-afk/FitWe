/**
 * Returns the current date. Mocking has been completely removed.
 */
export async function getNow(): Promise<Date> {
  return new Date();
}

/**
 * Synchronous version returning the current date.
 */
export function getNowSync(): Date {
  return new Date();
}
