import { getCollection, type CollectionEntry } from 'astro:content';

export type Concert = CollectionEntry<'concerts'>;

/** Midnight at the start of today (Sweden) — a concert "today" counts as upcoming. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Minutes since midnight for an "HH:MM" time; concerts without a time sort last. */
function timeRank(c: Concert): number {
  const t = c.data.time;
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** All concerts, oldest → newest; within a day, earliest start time first. */
export async function getConcertsByDate(): Promise<Concert[]> {
  const concerts = await getCollection('concerts');
  return concerts.sort((a, b) => {
    const byDate = a.data.date.getTime() - b.data.date.getTime();
    return byDate !== 0 ? byDate : timeRank(a) - timeRank(b);
  });
}

/** Upcoming (today onward), soonest first. */
export async function getUpcomingConcerts(limit?: number): Promise<Concert[]> {
  const today = startOfToday();
  const upcoming = (await getConcertsByDate()).filter((c) => c.data.date >= today);
  return typeof limit === 'number' ? upcoming.slice(0, limit) : upcoming;
}

/** Past concerts, most recent first. */
export async function getPastConcerts(): Promise<Concert[]> {
  const today = startOfToday();
  return (await getConcertsByDate())
    .filter((c) => c.data.date < today)
    .reverse();
}

/** Distinct venue names, alphabetically. */
export function uniqueVenues(concerts: Concert[]): string[] {
  return [...new Set(concerts.map((c) => c.data.venue))].sort((a, b) =>
    a.localeCompare(b, 'sv')
  );
}

/**
 * Venue → city lookup. Concerts don't carry a city field, so we map each known
 * venue to the town it sits in. Touring acts (Bohuslän Big Band, Bangen Jazz &
 * Blues) play many venues, so the key is always the physical venue, not the
 * organiser. When adding a new venue, add it here so it shows up in the city
 * filter; unmapped venues simply have no city.
 */
const VENUE_CITY: Record<string, string> = {
  // Stockholm
  Fasching: 'Stockholm',
  'Glenn Miller Café': 'Stockholm',
  Nalen: 'Stockholm',
  'Konserthuset Stockholm': 'Stockholm',
  Konserthuset: 'Stockholm',
  'Kulturhuset Stadsteatern': 'Stockholm',
  Slaktkyrkan: 'Stockholm',
  'Moderna Museet': 'Stockholm',
  Folkoperan: 'Stockholm',
  'Stallet Världens Musik': 'Stockholm',
  Allhelgonakyrkan: 'Stockholm',
  'Reimersholme Hotel': 'Stockholm',
  Vasamuseet: 'Stockholm',
  Scenkonstmuseet: 'Stockholm',
  'Nya Cirkus': 'Stockholm',
  'KFUM Central': 'Stockholm',
  Skansen: 'Stockholm',
  Aspen: 'Stockholm',
  'Bistro Eker': 'Stockholm',
  'Unity Jazz': 'Stockholm',
  'Utopia Jazz': 'Stockholm',
  // Göteborg
  Nefertiti: 'Göteborg',
  'Göteborgs Konserthus': 'Göteborg',
  'Playhouse Valand': 'Göteborg',
  'Stora teatern': 'Göteborg',
  'Musikens Hus': 'Göteborg',
  'World of Volvo': 'Göteborg',
  Monument: 'Göteborg',
  // Uppsala
  'Botaniska trädgården': 'Uppsala',
  'Uppsala Konsert & Kongress': 'Uppsala',
  Parksnäckan: 'Uppsala',
  Blackbird: 'Uppsala',
  // Malmö
  'Malmö Live': 'Malmö',
  'Slagthusets Teater': 'Malmö',
  // Lund
  Mejeriet: 'Lund',
  Stadshallen: 'Lund',
  // Sandviken (Bangen Jazz & Blues)
  'Sandvikens kyrka': 'Sandviken',
  Kanalgården: 'Sandviken',
  Musikverket: 'Sandviken',
  Stadsparken: 'Sandviken',
  Teaterbaren: 'Sandviken',
  Jansasscenen: 'Sandviken',
  // Bohuslän Big Band tour stops + others
  Culturum: 'Nyköping',
  Dergårdsteatern: 'Lerum',
  Kulturkvarteret: 'Kristianstad',
  'Kulturhuset Najaden': 'Halmstad',
  'Landskrona teater': 'Landskrona',
  Messingen: 'Upplands Väsby',
  'Scen Messingen': 'Upplands Väsby',
  'Skurups folkhögskola': 'Skurup',
  'Östergötlands museum': 'Linköping',
  'Gävle konserthus': 'Gävle',
  'Vara Konserthus': 'Vara',
  'Vallentuna Teater': 'Vallentuna',
  'Folkets Hus Kallhäll': 'Järfälla',
  'Huddinge Kulturhus hos Folkes': 'Huddinge',
  'Skottvångs Grufva': 'Gnesta',
  'Caféscenen i Spira': 'Jönköping',
  'Birka Folkhögskola': 'Ås',
  // Festivals used as venue
  'Ystad Sweden Jazz Festival': 'Ystad',
  'Umeå Jazzfestival': 'Umeå',
  'Arild Jazzfestival': 'Arild',
};

/** City for a venue, or '' if the venue isn't mapped. */
export function cityForVenue(venue: string): string {
  return VENUE_CITY[venue] ?? '';
}

/** Distinct cities across the given concerts, alphabetically. */
export function uniqueCities(concerts: Concert[]): string[] {
  return [
    ...new Set(concerts.map((c) => cityForVenue(c.data.venue)).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'sv'));
}

/** Distinct festival names (concerts without a festival are ignored), alphabetically. */
export function uniqueFestivals(concerts: Concert[]): string[] {
  return [...new Set(concerts.map((c) => c.data.festival).filter((f): f is string => !!f))].sort(
    (a, b) => a.localeCompare(b, 'sv')
  );
}

export interface ConcertGroup {
  /** YYYY-MM-DD key */
  key: string;
  /** Display heading, e.g. "Onsdag 3 juni 2026" */
  label: string;
  concerts: Concert[];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Group concerts by calendar day. Input order is preserved, so pass an
 * already-sorted list (ascending for upcoming, descending for past).
 */
export function groupByDate(concerts: Concert[]): ConcertGroup[] {
  const map = new Map<string, Concert[]>();
  for (const c of concerts) {
    const key = dateKey(c.data.date);
    (map.get(key) ?? map.set(key, []).get(key)!).push(c);
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    label: capitalize(
      formatDate(items[0].data.date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    ),
    concerts: items,
  }));
}

/** Format a concert date in Swedish locale. */
export function formatDate(
  date: Date,
  opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return date.toLocaleDateString('sv-SE', opts);
}
