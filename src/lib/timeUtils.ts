import { cookies } from "next/headers";

/**
 * Returns the current date, but allows mocking it via a cookie for testing purposes.
 * This is extremely useful for QA to test time-dependent logic (48h booking, sub expiration, etc).
 */
export async function getNow(): Promise<Date> {
  try {
    const cookieStore = await cookies();
    const mockDateStr = cookieStore.get("fitwe-mock-date")?.value;

    if (mockDateStr) {
      const mockDate = new Date(mockDateStr);
      if (!isNaN(mockDate.getTime())) {
        return mockDate;
      }
    }
  } catch (e) {
    // cookies() might throw if called outside of request context (though rare in Next.js 15+ APIs/RSC)
    // In that case, we fallback to real time.
  }

  return new Date();
}

/**
 * Synchronous version for simple client-side checks if needed, 
 * though the primary logic should reside on the server for security.
 */
export function getNowSync(): Date {
  // In client side, we could read document.cookie if we wanted to sync, 
  // but for the scope of this task, the server-side barrier is what matters most.
  return new Date();
}
