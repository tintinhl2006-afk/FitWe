/**
 * Escapes a value for use inside generated HTML. Exercise and routine names come from a catalog
 * other users can write to, so they must never be interpolated raw into the HTML that expo-print
 * renders to a PDF the member then shares.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
