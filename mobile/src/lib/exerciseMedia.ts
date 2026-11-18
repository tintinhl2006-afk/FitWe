import { API_BASE_URL } from './apiClient';

/**
 * Absolute URL of an exercise's technique GIF, derived from its image: "/press_banca.jpg" ->
 * "<API>/gifs/press_banca.gif". The GIFs live in the web app's public/gifs (see
 * scripts/generate-exercise-gifs.mjs). Exercises without a generated GIF return a URL that 404s; the
 * caller hides it on load error. Null when the image is absent or external.
 */
export function exerciseGifUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || !imageUrl.startsWith('/')) return null;
  const file = imageUrl.split('/').pop() ?? '';
  const base = file.replace(/\.[^.]+$/, '');
  return base ? `${API_BASE_URL}/gifs/${base}.gif` : null;
}
