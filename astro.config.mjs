// @ts-check
import { defineConfig } from 'astro/config';
import { execSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/** Unique-per-deploy id for the service-worker cache: the git commit, or a
 *  build timestamp when git isn't available. */
function buildId() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
}

/**
 * Stamp a fresh cache version into the built service worker so every deploy
 * invalidates old caches automatically — no manual VERSION bump needed.
 * @type {import('astro').AstroIntegration}
 */
const stampServiceWorker = {
  name: 'stamp-sw-version',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const swUrl = new URL('sw.js', dir);
      let code;
      try {
        code = await readFile(swUrl, 'utf8');
      } catch {
        logger.warn('sw.js not found in output — skipping cache-version stamp');
        return;
      }
      const id = buildId();
      const stamped = code.replace(/const VERSION = '[^']*';/, `const VERSION = '${id}';`);
      if (stamped === code) {
        logger.warn("Could not find `const VERSION = '…'` in sw.js — left unchanged");
        return;
      }
      await writeFile(swUrl, stamped);
      logger.info(`service worker cache version set to "${id}"`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://jazzkonserter.se',
  integrations: [mdx(), sitemap(), stampServiceWorker],
});
