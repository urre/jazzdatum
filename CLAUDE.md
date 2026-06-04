# Jazzkonserter.se - Claude Project Context

## Project Overview

Jazzkonserter.se is an Astro-based website that aggregates and presents jazz concerts from venues across Sweden. The site uses Astro's content collections with MDX for concert data storage and presentation.

## Tech Stack

- **Framework**: Astro 6.x with MDX integration (Content Layer API)
- **TypeScript**: Strict mode enabled
- **Content**: MDX files in content collections (glob loader)
- **Styling**: CSS Modules (`*.module.css`) + global design tokens in `src/styles/global.css`
- **Feeds/SEO**: `@astrojs/rss` (`/rss.xml`) and `@astrojs/sitemap`
- **Node**: v22.19.0

## Project Structure

```
jazzkonserter.se/
├── src/
│   ├── components/
│   │   ├── ConcertCard.astro       # Reusable concert card (full + compact)
│   │   └── ConcertCard.module.css
│   ├── content/
│   │   └── concerts/               # Concert MDX files (*.mdx)
│   ├── content.config.ts           # Content collection schema + glob loader
│   ├── layouts/
│   │   ├── Layout.astro            # Main layout + SEO/OG meta
│   │   └── Layout.module.css
│   ├── lib/
│   │   └── concerts.ts             # Data helpers (sort, upcoming/past, format)
│   ├── pages/
│   │   ├── index.astro             # Homepage (hero + upcoming)
│   │   ├── 404.astro
│   │   ├── rss.xml.ts              # RSS feed of upcoming concerts
│   │   └── concerts/
│   │       ├── index.astro         # All concerts + venue filter
│   │       └── [slug].astro        # Individual concert pages
│   └── styles/
│       └── global.css              # Design tokens, reset, shared buttons
├── .claude/skills/                 # Project-local Claude skills (jazz-concert-scraper)
├── public/                         # Static assets
└── astro.config.mjs                # Astro configuration (site, mdx, sitemap)
```

## Concert Data Schema

Concerts are stored as MDX files with the following frontmatter schema (defined in `src/content.config.ts`):

```typescript
{
  title: string              // Concert title/event name
  artist: string             // Main artist/band name
  venue: string              // Venue name
  venueUrl?: string          // Venue website URL
  date: Date                 // Concert date (YYYY-MM-DD)
  time?: string              // Start time (HH:MM format)
  price?: string             // Ticket price info
  description?: string       // Short description
  genre: string[]            // Default: ['jazz']
  image?: string             // Concert/artist image URL
  ticketUrl?: string         // Ticket purchase link
  sourceUrl?: string         // Original source URL
}
```

### MDX File Naming Convention

Format: `{venue-slug}-{artist-slug}-{date}.mdx`

Examples:
- `nefertiti-jazz-quartet-2026-06-15.mdx`
- `fasching-bobo-stenson-trio-2026-07-20.mdx`
- `glenn-miller-esperanza-spalding-2026-08-10.mdx`

Rules:
- Lowercase only
- Spaces → hyphens
- Remove special characters
- Date format: YYYY-MM-DD

## Concert Scraping

### Scraped Venues

The site aggregates concerts from these Swedish jazz venues:

1. **Glenn Miller Café** - https://www.glennmillercafe.se/konserter
2. **Nefertiti Jazz Club** - https://www.nefertiti.se/
3. **Fasching** - https://www.fasching.se/en/calendar/
4. **Konserthuset (Blue House)** - https://www.konserthuset.se/program-och-biljetter/konsertserier/blue-house-jazz/
5. **Svensk Jazz** - https://svenskjazz.se/konserter/
6. **Konserthuset (Jazz)** - https://www.konserthuset.se/om-oss/var-verksamhet/jazz-i-konserthuset/
7. **Vara Konserthus** - https://www.varakonserthus.se/evenemang/jazz-och-storband/
8. **Digga Göteborg** - https://digga.se/app/goteborg/konsert/jazz

### Using the Jazz Scraper Skill

A Claude skill exists for automated concert scraping: `jazz-concert-scraper`

**Location**: `.claude/skills/jazz-concert-scraper/SKILL.md` (project-local, checked into the repo)

**To scrape concerts**, simply say:
- "Scrape all jazz concerts"
- "Update concerts from Nefertiti"
- "Check for new jazz dates"
- "Collect concert data"

The skill will:
1. Fetch concert data from venue websites
2. Parse and structure the data
3. Generate MDX files in `src/content/concerts/`
4. Check for duplicates
5. Report results

### Manual Concert Entry

To manually add a concert, create a new MDX file in `src/content/concerts/`:

```mdx
---
title: "Summer Jazz Festival"
artist: "Bobo Stenson Trio"
venue: "Fasching"
venueUrl: "https://www.fasching.se"
date: 2026-07-15
time: "20:00"
price: "350 kr"
description: "An evening of Nordic jazz with legendary pianist Bobo Stenson."
genre: ["jazz", "nordic jazz"]
ticketUrl: "https://www.fasching.se/tickets"
sourceUrl: "https://www.fasching.se/en/calendar/"
---

Bobo Stenson brings his acclaimed trio to Fasching for a night of introspective and
beautiful Nordic jazz. Known for his unique approach to standards and originals,
this concert promises to be an unforgettable experience.
```

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx astro check

# Add integrations
npx astro add [integration-name]
```

## Coding Conventions

### Astro Components

- Use `.astro` extension for Astro components
- Prefer inline styles for now (consider CSS modules/Tailwind later)
- Use TypeScript interfaces for props
- Component names: PascalCase
- File names: kebab-case for pages, PascalCase for components

### Content Collections

- Always validate against schema in `src/content.config.ts`
- Use `getCollection()` to fetch concert data
- Sort by date for chronological listings
- Filter by date for upcoming/past concerts

### Dates and Times

- **Date format**: ISO 8601 (YYYY-MM-DD)
- **Time format**: 24-hour (HH:MM)
- **Timezone**: Assume Sweden/Stockholm
- **Display format**: Swedish locale (`sv-SE`)

### URLs and Links

- Use `target="_blank" rel="noopener"` for external links
- Venue URLs should be stored in `venueUrl` field
- Ticket links should be stored in `ticketUrl` field
- Always include `sourceUrl` for attribution

## Content Guidelines

### Swedish Language

- Primary language: Swedish
- UI labels in Swedish
- Concert descriptions can be Swedish or English (as sourced)
- Date formatting: Swedish locale

### Concert Descriptions

- Keep descriptions concise but informative
- Include artist background if notable
- Mention special guests or program highlights
- Use markdown formatting in MDX body

### Genre Tags

Common genre tags:
- `jazz` (default for all)
- `bebop`, `swing`, `contemporary`
- `nordic jazz`, `latin jazz`, `fusion`
- `vocal jazz`, `big band`
- `experimental`, `free jazz`

## Future Enhancements

Consider implementing:

1. **Styling improvements**
   - Move to Tailwind CSS or CSS modules
   - Responsive design refinements
   - Dark mode support

2. **Features**
   - Search and filter functionality
   - Calendar view
   - Artist pages/profiles
   - Venue pages
   - Email notifications for new concerts
   - RSS feed

3. **Automation**
   - Scheduled scraping (GitHub Actions/cron)
   - Automated duplicate detection
   - Concert reminder system

4. **Performance**
   - Image optimization
   - Static generation optimization
   - SEO improvements (meta tags, structured data)

5. **Data**
   - Database integration (optional)
   - API endpoints
   - Concert archive

## Troubleshooting

### Build Errors

**"Cannot find module '@astrojs/mdx'"**
- Run `npm install @astrojs/mdx`

**Content collection validation errors**
- Check frontmatter matches schema in `src/content.config.ts`
- Verify date format is YYYY-MM-DD
- Ensure required fields (title, artist, venue, date) are present

### Scraping Issues

**No concerts found from venue**
- Venue website structure may have changed
- Check if URL is still valid
- Manually inspect page content

**Duplicate concerts created**
- Check file naming convention
- Verify deduplication logic
- Compare by artist + date + venue

## Resources

- [Astro Documentation](https://docs.astro.build)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [MDX Documentation](https://mdxjs.com/)

## Contact & Maintenance

- **Recommended scraping frequency**: Weekly
- **Content review**: Check new entries for accuracy
- **Updates**: Monitor venue websites for structural changes

---

*Last updated: 2026-06-02*
