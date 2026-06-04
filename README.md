# 🎷 Jazzdatum.se

An [Astro](https://astro.build) site that aggregates and presents jazz concerts
from venues across Sweden. Concert data lives as MDX files in an Astro content
collection and is collected via the `jazz-concert-scraper` Claude skill.

## Tech stack

- **Astro 6** with the MDX integration and the **Content Layer API**
- **TypeScript** (strict)
- **CSS Modules** (`*.module.css`) + global design tokens in `src/styles/global.css`
- RSS feed (`@astrojs/rss`) and sitemap (`@astrojs/sitemap`)

## Project structure

```text
src/
├── components/
│   ├── ConcertCard.astro          # reusable concert card (full + compact)
│   └── ConcertCard.module.css
├── content/
│   └── concerts/*.mdx             # one MDX file per concert
├── content.config.ts             # content collection schema + glob loader
├── layouts/
│   ├── Layout.astro              # shell + SEO/OG meta
│   └── Layout.module.css
├── lib/
│   └── concerts.ts               # data helpers (sort, upcoming/past, format)
├── pages/
│   ├── index.astro               # home: hero + upcoming
│   ├── 404.astro
│   ├── rss.xml.ts                # RSS feed of upcoming concerts
│   └── concerts/
│       ├── index.astro           # all concerts + venue filter
│       └── [slug].astro          # individual concert page
└── styles/global.css             # design tokens, reset, shared buttons
```

## Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npx astro check` | Type-check |

## Adding concerts

**Automatically** — ask Claude Code to "scrape jazz concerts" (or update a
specific venue). The `jazz-concert-scraper` skill fetches the venue sites and
writes MDX via `scripts/add-concerts.mjs`, deduping by venue + artist + date.

**Manually** — create `src/content/concerts/{venue}-{artist}-{date}.mdx`:

```mdx
---
title: "Bobo Stenson Trio"
artist: "Bobo Stenson Trio"
venue: "Fasching"
venueUrl: "https://www.fasching.se"
date: 2026-07-15
time: "20:00"
price: "350 kr"
description: "An evening of Nordic jazz."
genre: ["jazz", "nordic jazz"]
ticketUrl: "https://www.fasching.se/tickets"
sourceUrl: "https://www.fasching.se/en/calendar/"
---

Longer description rendered on the concert page.
```

Required fields: `title`, `artist`, `venue`, `date` (YYYY-MM-DD). `venueUrl`,
`ticketUrl`, `sourceUrl`, and `image` must be valid URLs if present.

See [CLAUDE.md](CLAUDE.md) for the full project context and conventions.
