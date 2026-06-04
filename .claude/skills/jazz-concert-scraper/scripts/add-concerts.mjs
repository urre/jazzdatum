#!/usr/bin/env node
// add-concerts.mjs — deterministic MDX writer + deduper for jazzdatum.se
//
// Reads an array of concert objects as JSON (from --file, --json, or stdin),
// validates them against the content schema, generates slugged MDX files, and
// skips duplicates. Pure Node built-ins, no dependencies.
//
// Usage:
//   node add-concerts.mjs --file concerts.json
//   echo '[{...}]' | node add-concerts.mjs
//   node add-concerts.mjs --json '[{...}]' --content-dir /path/to/concerts
//   ...add --update to overwrite existing files, --dry-run to preview.
//
// Concert object (required: title, artist, venue, date):
//   {
//     "title": "...", "artist": "...", "venue": "...",
//     "date": "2026-06-15",            // YYYY-MM-DD
//     "venueUrl": "https://...",        // optional
//     "time": "20:00",                  // optional, HH:MM
//     "price": "250 kr",                // optional
//     "description": "...",             // optional (also used as body fallback)
//     "genre": ["jazz", "nordic jazz"], // optional, defaults to ["jazz"]
//     "image": "https://...",           // optional
//     "ticketUrl": "https://...",       // optional
//     "sourceUrl": "https://...",       // optional
//     "body": "Full markdown body..."   // optional MDX body
//   }
//
// Output: a JSON summary { created, skipped, errors } printed to stdout.

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// This script lives at <repo>/.claude/skills/jazz-concert-scraper/scripts/.
// Default to the repo's concerts dir (4 levels up) so it works wherever the
// repo is cloned. Override with --content-dir.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTENT_DIR = resolve(__dirname, '../../../../src/content/concerts');

// ---- arg parsing ------------------------------------------------------------
function parseArgs(argv) {
  const args = { update: false, dryRun: false, contentDir: DEFAULT_CONTENT_DIR };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--update') args.update = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--json') args.json = argv[++i];
    else if (a === '--content-dir') args.contentDir = argv[++i];
  }
  return args;
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
}

// ---- slug / normalization ---------------------------------------------------
const TRANSLIT = {
  å: 'a', ä: 'a', ö: 'o', é: 'e', è: 'e', ê: 'e', ü: 'u',
  ø: 'o', æ: 'ae', å̊: 'a', ñ: 'n', ç: 'c', á: 'a', à: 'a', í: 'i', ó: 'o', ú: 'u',
};

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[åäöéèêüøæñçáàíóú]/g, (c) => TRANSLIT[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip remaining diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function toISODate(value) {
  // Accept "2026-06-15", Date, or "2026-06-15T..." — return YYYY-MM-DD or null.
  if (!value) return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function filenameFor(c) {
  return `${slugify(c.venue)}-${slugify(c.artist)}-${c.date}.mdx`;
}

// ---- YAML / MDX emit --------------------------------------------------------
function yamlString(v) {
  // Always double-quote; escape backslashes and double-quotes.
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildMdx(c) {
  const lines = ['---'];
  lines.push(`title: ${yamlString(c.title)}`);
  lines.push(`artist: ${yamlString(c.artist)}`);
  lines.push(`venue: ${yamlString(c.venue)}`);
  if (c.venueUrl) lines.push(`venueUrl: ${yamlString(c.venueUrl)}`);
  lines.push(`date: ${c.date}`); // YYYY-MM-DD, unquoted for z.coerce.date()
  if (c.time) lines.push(`time: ${yamlString(c.time)}`);
  if (c.price) lines.push(`price: ${yamlString(c.price)}`);
  if (c.description) lines.push(`description: ${yamlString(c.description)}`);
  const genre = Array.isArray(c.genre) && c.genre.length ? c.genre : ['jazz'];
  lines.push(`genre: [${genre.map(yamlString).join(', ')}]`);
  if (c.image) lines.push(`image: ${yamlString(c.image)}`);
  if (c.ticketUrl) lines.push(`ticketUrl: ${yamlString(c.ticketUrl)}`);
  if (c.sourceUrl) lines.push(`sourceUrl: ${yamlString(c.sourceUrl)}`);
  lines.push('---');
  lines.push('');
  lines.push((c.body || c.description || '').trim());
  lines.push('');
  return lines.join('\n');
}

// ---- validation + dedup -----------------------------------------------------
function validate(raw) {
  const errors = [];
  const c = { ...raw };
  for (const field of ['title', 'artist', 'venue']) {
    if (!c[field] || !String(c[field]).trim()) errors.push(`missing ${field}`);
  }
  const iso = toISODate(c.date);
  if (!iso) errors.push(`invalid or missing date: ${JSON.stringify(c.date)}`);
  else c.date = iso;
  if (c.time && !/^\d{1,2}:\d{2}$/.test(String(c.time).trim())) {
    errors.push(`invalid time (want HH:MM): ${c.time}`);
  }
  return { concert: c, errors };
}

// Build a signature index of existing files for dedup by venue+artist+date.
function existingSignatures(contentDir) {
  const sigs = new Set();
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.mdx'));
  for (const file of files) {
    const text = readFileSync(join(contentDir, file), 'utf8');
    const fm = text.split('---')[1] ?? '';
    const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) || [])[1] ?? '';
    const sig = `${slugify(get('venue'))}|${slugify(get('artist'))}|${toISODate(get('date'))}`;
    sigs.add(sig);
  }
  return sigs;
}

// ---- main -------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contentDir = resolve(args.contentDir);
  if (!existsSync(contentDir)) {
    if (args.dryRun) {
      console.error(`(dry-run) content dir would be created: ${contentDir}`);
    } else {
      mkdirSync(contentDir, { recursive: true });
    }
  }

  let payload = args.json;
  if (!payload && args.file) payload = readFileSync(args.file, 'utf8');
  if (!payload) payload = await readStdin();
  if (!payload) {
    console.error('No input. Provide --file, --json, or pipe JSON via stdin.');
    process.exit(1);
  }

  let items;
  try {
    const parsed = JSON.parse(payload);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error(`Could not parse JSON input: ${e.message}`);
    process.exit(1);
  }

  const sigs = existsSync(contentDir) ? existingSignatures(contentDir) : new Set();
  const summary = { created: [], updated: [], skipped: [], errors: [] };

  for (const raw of items) {
    const { concert, errors } = validate(raw);
    if (errors.length) {
      summary.errors.push({ input: raw, errors });
      continue;
    }
    const filename = filenameFor(concert);
    const filepath = join(contentDir, filename);
    const sig = `${slugify(concert.venue)}|${slugify(concert.artist)}|${concert.date}`;
    const exists = existsSync(filepath) || sigs.has(sig);

    if (exists && !args.update) {
      summary.skipped.push({ filename, reason: 'duplicate', artist: concert.artist, venue: concert.venue, date: concert.date });
      continue;
    }

    const mdx = buildMdx(concert);
    if (args.dryRun) {
      (exists ? summary.updated : summary.created).push({ filename, dryRun: true });
    } else {
      writeFileSync(filepath, mdx, 'utf8');
      (exists ? summary.updated : summary.created).push({ filename });
      sigs.add(sig);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  const total = summary.created.length + summary.updated.length;
  console.error(
    `\n${args.dryRun ? '(dry-run) ' : ''}${total} written ` +
    `(${summary.created.length} new, ${summary.updated.length} updated), ` +
    `${summary.skipped.length} duplicates skipped, ${summary.errors.length} errors.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
