// Web-only stand-in for expo-secure-store (which has no web implementation).
// Used through the metro.config.js alias so the app can be previewed in a browser.
export async function getItemAsync(key: string): Promise<string | null> {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
}
