---
name: jazz-concert-scraper
description: >-
  Collect upcoming jazz concerts from Swedish venue websites (Glenn Miller Café,
  Nefertiti, Fasching, Konserthuset, Svensk Jazz, Vara Konserthus, Digga
  Göteborg) and save them as MDX content for jazzdatum.se. Use when the user
  asks to scrape, collect, fetch, or update jazz concerts / concert dates, or
  to add concerts to jazzdatum.se. Triggers: "scrape concerts", "update
  concerts", "fetch jazz dates", "collect concert data", "check for new jazz
  concerts".
allowed-tools: WebFetch, WebSearch, Read, Write, Glob, Bash
---

# Jazz Concert Scraper

Fetch upcoming jazz concerts from Swedish venues and write them as validated MDX
files into `jazzdatum.se/src/content/concerts/`. A deterministic helper script
(`scripts/add-concerts.mjs`) does the slugging, frontmatter formatting, schema
validation, and deduplication — your job is to **fetch and extract structured
data**, then hand it to the script.

## Target project

```
/Users/urbansanden/projects/Current/jazzdatum.se/src/content/concerts/
```

This is the helper script's default `--content-dir`. Override with
`--content-dir <path>` if the project lives elsewhere.

## Venues

| # | Venue | URL | Notes |
|---|-------|-----|-------|
| 1 | Glenn Miller Café | https://www.glennmillercafe.se/konserter | Mostly static HTML; weekly listings |
| 2 | Nefertiti | https://www.nefertiti.se/ | JS-rendered calendar — see "JS-heavy sites" |
| 3 | Fasching | https://www.fasching.se/en/calendar/ | English calendar; JS-rendered |
| 4 | Konserthuset – Blue House Jazz | https://www.konserthuset.se/program-och-biljetter/konsertserier/blue-house-jazz/ | Filter to the Blue House series |
| 5 | Svensk Jazz | https://svenskjazz.se/konserter/ | National listings across many towns |
| 6 | Konserthuset – Jazz | https://www.konserthuset.se/om-oss/var-verksamhet/jazz-i-konserthuset/ | Overlaps #4; dedup handles repeats |
| 7 | Vara Konserthus | https://www.varakonserthus.se/evenemang/jazz-och-storband/ | Jazz & storband (big band) |
| 8 | Digga Göteborg | https://digga.se/app/goteborg/konsert/jazz | Single-page app — heavily JS-rendered, returns nothing |
| 9 | Unity Jazz | https://www.unityjazz.se/program | Göteborg club; event links are relative paths |
| 10 | Playhouse Valand | https://playhouse.nu/program/ | Göteborg; has prices + per-event ticket links |
| 11 | Ystad Sweden Jazz Festival | https://ystadjazz.se/biljetter/ | Use the **/biljetter/** page for dates; landing page lists artists only. Many stages — attribute `venue: "Ystad Sweden Jazz Festival"`, put the stage in the description |
| 12 | Umeå Jazzfestival | https://umeajazzfestival.se/program | Stages (Idun/Studion/Äpplet) → put in description, `venue: "Umeå Jazzfestival"` |
| 13 | Stockholm Jazz | https://stockholmjazz.se/program | Festival (Oct); detailed program often not published until closer — may return only dates |
| 14 | Göteborgs Symfoniker (GSO) | https://www.gso.se/gsoplay/konserter-och-klipp/jazzkonserter/ | Sparse; listings often lack dates — verify before adding |
| 15 | Malmö Live | https://malmolive.se/kommande-jazz-pa-malmo-live-konserthus | Stage (Kuben/Konsertsalen) → description, `venue: "Malmö Live"`; has prices + ticket links |
| 16 | Tickster (jazz-taggade) | https://www.tickster.com/se/sv/events/tagged/jazz | National platform — many cities/venues. Use the event's real venue; **may overlap other sources, so dedup matters**. Often no times/prices |

## Workflow

### 1. Fetch each venue

Use **WebFetch** with a focused prompt, e.g.:

> "List every upcoming concert on this page. For each, give the artist/band
> name, event title, date (with year), start time, ticket price, a short
> description, and the ticket link."

Fetch venues one at a time. If a page fails, note it and continue with the rest.

### 2. Extract structured data

Build a JSON **array** of concert objects. Required: `title`, `artist`,
`venue`, `date`. The rest are optional.

```json
[
  {
    "title": "Bobo Stenson Trio",
    "artist": "Bobo Stenson Trio",
    "venue": "Fasching",
    "venueUrl": "https://www.fasching.se",
    "date": "2026-07-15",
    "time": "20:00",
    "price": "350 kr",
    "description": "An evening of Nordic jazz.",
    "genre": ["jazz", "nordic jazz"],
    "ticketUrl": "https://www.fasching.se/tickets/...",
    "sourceUrl": "https://www.fasching.se/en/calendar/",
    "body": "Optional longer markdown description for the concert page."
  }
]
```

Normalization rules:
- **Date** → `YYYY-MM-DD`. Swedish month names: jan, feb, mar(s), apr, maj, jun(i),
  jul(i), aug, sep, okt, nov, dec. If a listing omits the year, infer it: a month
  earlier than the current month belongs to **next** year.
- **Time** → `HH:MM` (24-hour). Drop "kl." prefixes.
- **Price** → keep the source string (e.g. `"250 kr"`, `"Fri entré"`).
- **genre** → always include `"jazz"`; add specifics (`"big band"`, `"vocal jazz"`,
  `"nordic jazz"`, `"latin jazz"`, `"free jazz"`) when the listing makes them clear.
- Only include **upcoming** concerts (today or later) unless the user asks for archives.

### 3. Write the MDX files

Pipe the JSON to the helper script. Save the array to a temp file first (cleaner
than a giant `--json` arg). Run from the repo root:

```bash
node .claude/skills/jazz-concert-scraper/scripts/add-concerts.mjs --file /tmp/concerts.json
```

The script defaults to this repo's `src/content/concerts/` (resolved relative to
the script), so no path config is needed when run from the project.

Other invocations:
- `--dry-run` — preview what would be written without touching disk.
- `--update` — overwrite existing matching files (use when refreshing details).
- `--content-dir <path>` — target a different project location.
- Pipe via stdin: `echo '[...]' | node .claude/skills/jazz-concert-scraper/scripts/add-concerts.mjs`

The script prints a JSON summary (`created`, `updated`, `skipped`, `errors`) to
stdout and a one-line tally to stderr.

### 4. Deduplication (automatic)

The script skips a concert when a file with the same **venue + artist + date**
already exists — it scans existing frontmatter, so it catches duplicates even if
filenames differ or the same concert appears on two venue pages (e.g. #4 vs #6).
Pass `--update` to refresh rather than skip.

### 5. Report

Summarize for the user: concerts found per venue, new vs. updated vs. skipped,
and any venues that failed to load or rows the script rejected (in `errors`).

## JS-heavy sites (Nefertiti, Fasching, Digga)

These render listings client-side, so WebFetch may return little or stale
content. If a fetch comes back empty or obviously incomplete:
1. Try the printable / RSS / sitemap variant if one exists.
2. Use **WebSearch** for `"<venue>" jazz konsert <month> <year>` to recover
   dates, then confirm details against the venue page.
3. If a venue still can't be parsed, report it as failed rather than inventing
   data. **Never fabricate concerts, dates, or prices.**

## Schema reference

Files validate against `jazzdatum.se/src/content.config.ts`:

| Field | Type | Required |
|-------|------|----------|
| title | string | ✅ |
| artist | string | ✅ |
| venue | string | ✅ |
| date | date (YYYY-MM-DD) | ✅ |
| venueUrl | url | optional |
| time | string (HH:MM) | optional |
| price | string | optional |
| description | string | optional |
| genre | string[] | optional (defaults to `["jazz"]`) |
| image | string | optional |
| ticketUrl | url | optional |
| sourceUrl | url | optional |

> ⚠️ `venueUrl`, `ticketUrl`, `sourceUrl`, and `image` are validated as URLs.
> Omit them rather than passing a non-URL placeholder, or the build will fail.

## Filename convention

`{venue-slug}-{artist-slug}-{date}.mdx` — generated automatically (lowercase,
Swedish characters transliterated: å/ä→a, ö→o, é→e). Example:
`fasching-bobo-stenson-trio-2026-07-15.mdx`.

## Verify

After writing, optionally confirm the site still builds:

```bash
cd /Users/urbansanden/projects/Current/jazzdatum.se && npm run build
```

## Recommended cadence

Weekly. Re-running is safe — duplicates are skipped automatically.
