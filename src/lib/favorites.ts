// Favorite concerts, kept per visitor in localStorage (a static site has no
// accounts). Ids are concert slugs. Every change fires FAVORITES_EVENT on
// document so hearts and the sidebar's Favoriter button stay in sync.
const KEY = 'jk:favorites';
export const FAVORITES_EVENT = 'jk:favorites-change';

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
  } catch (e) {
    return new Set();
  }
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const on = !favs.has(id);
  if (on) favs.add(id);
  else favs.delete(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...favs]));
  } catch (e) {}
  document.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  return on;
}
