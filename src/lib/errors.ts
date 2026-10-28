/**
 * Message of a caught value, or undefined if it has none. Replaces `catch (e: any)` + `e.message`:
 * a caught value can be anything, so it is `unknown` and this reads the message safely. Returning
 * undefined (rather than "") keeps `err.message || "fallback"` and `err.message ?? "fallback"`
 * behaving exactly as they did.
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string") return message;
  }
  return undefined;
}
