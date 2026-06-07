import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const concerts = defineCollection({
  // Astro 6 Content Layer API: load MDX files from the concerts directory.
  loader: glob({ pattern: '**/*.mdx', base: './src/content/concerts' }),
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    venue: z.string(),
    /** Festival this concert belongs to, e.g. "Stockholm Jazz Festival" — lets
        multi-venue festivals be grouped/filtered together. */
    festival: z.string().optional(),
    venueUrl: z.string().url().optional(),
    date: z.coerce.date(),
    time: z.string().optional(),
    price: z.string().optional(),
    description: z.string().optional(),
    genre: z.array(z.string()).default(['jazz']),
    image: z.string().optional(),
    ticketUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
  }),
});

export const collections = { concerts };
