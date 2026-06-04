import type { Concert } from './concerts';

const pad = (n: number) => String(n).padStart(2, '0');

/** schema.org MusicEvent for a concert. Times are emitted as local date-times
 *  (no offset) which Google accepts and avoids DST conversion bugs. */
export function musicEventSchema(concert: Concert, site: URL | string) {
  const { data, id } = concert;
  const y = data.date.getUTCFullYear();
  const mo = data.date.getUTCMonth();
  const d = data.date.getUTCDate();
  const dateStr = `${y}-${pad(mo + 1)}-${pad(d)}`;

  let startDate = dateStr;
  let endDate: string | undefined;
  if (data.time && /^\d{1,2}:\d{2}$/.test(data.time)) {
    const [hh, mm] = data.time.split(':').map((n) => parseInt(n, 10));
    startDate = `${dateStr}T${pad(hh)}:${pad(mm)}`;
    const e = new Date(Date.UTC(y, mo, d, hh, mm) + 2 * 60 * 60 * 1000);
    endDate = `${e.getUTCFullYear()}-${pad(e.getUTCMonth() + 1)}-${pad(e.getUTCDate())}T${pad(e.getUTCHours())}:${pad(e.getUTCMinutes())}`;
  }

  const url = new URL(`/concerts/${id}/`, site).href;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: data.title || data.artist,
    startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: data.venue,
      address: { '@type': 'PostalAddress', addressCountry: 'SE' },
    },
    performer: { '@type': 'MusicGroup', name: data.artist },
    url,
  };
  if (endDate) schema.endDate = endDate;
  if (data.description) schema.description = data.description;
  if (data.image) schema.image = data.image;
  if (data.ticketUrl) {
    schema.offers = {
      '@type': 'Offer',
      url: data.ticketUrl,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
    };
  }
  return schema;
}
