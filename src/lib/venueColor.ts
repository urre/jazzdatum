// Deterministic colour per venue, shared by the list rows and the detail page
// so a venue keeps the same hue everywhere.

const VENUE_COLORS = ['#7c5cff', '#f3801f', '#1fb6a6', '#ef5da8', '#f6b73c', '#3b82f6', '#34b27b'];

export function venueColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return VENUE_COLORS[hash % VENUE_COLORS.length];
}

/** Black or white text for legibility against the given colour. */
export function venueTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1f1a2e' : '#ffffff';
}

/** A soft tint of the colour (mostly white) for backgrounds. */
export function venueTint(hex: string, whiteAmount = 0.9): string {
  const ch = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * whiteAmount);
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(ch(1)))}${to2(mix(ch(3)))}${to2(mix(ch(5)))}`;
}
