import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getUpcomingConcerts, formatDate } from '../lib/concerts';

export async function GET(context: APIContext) {
  const upcoming = await getUpcomingConcerts();
  const site = context.site ?? new URL('https://jazzkonserter.se');

  return rss({
    title: 'Jazzkonserter.se – kommande jazzkonserter',
    description: 'Kommande jazzkonserter på spelställen runt om i Sverige.',
    site,
    items: upcoming.map((concert) => ({
      title: `${concert.data.artist} – ${concert.data.venue}`,
      pubDate: concert.data.date,
      link: `/concerts/${concert.id}/`,
      description:
        concert.data.description ??
        `${concert.data.artist} på ${concert.data.venue}, ${formatDate(concert.data.date)}${
          concert.data.time ? ` kl. ${concert.data.time}` : ''
        }.`,
      categories: concert.data.genre,
    })),
    customData: '<language>sv-SE</language>',
  });
}
