/**
 * Marker for accounts that were closed by their owner but kept because they have issued invoices.
 *
 * Invoices are fiscal documents the gym must keep, and they reference the member by id, so the
 * row cannot be deleted. Instead everything personal that is not needed on an invoice is erased
 * and the login is made unusable. `.invalid` is a reserved TLD (RFC 2606): it can never receive
 * mail and can never collide with a real address.
 */
export const ERASED_EMAIL_DOMAIN = "deleted.invalid";

export function erasedEmail(userId: string): string {
  return `deleted-${userId}@${ERASED_EMAIL_DOMAIN}`;
}
