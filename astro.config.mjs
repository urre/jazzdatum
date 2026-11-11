// @ts-check
import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// CSS Module class names hash the file *path*, not its contents (the default).
// In dev, Astro inlines a cached copy of a module's CSS that can lag behind an
// edit; with content hashes that stale copy no longer matches the markup's
// class names and the page renders unstyled. Path hashes stay identical.
/** @param {string} name @param {string} filename */
const scopedName = (name, filename) => {
  const file = relative(process.cwd(), filename.split('?')[0]);
  const hash = createHash('md5').update(file).digest('base64url').slice(0, 5);
  return `_${name}_${hash}`;
};

// https://astro.build/config
export default defineConfig({
  site: 'https://jazzkonserter.se',
  integrations: [mdx(), sitemap()],
  vite: {
    css: {
      modules: { generateScopedName: scopedName },
    },
  },
});
