# Fonts

The site is configured to use **Google Sans** (Bold for headings, Regular for body),
self-hosted from this directory.

## Required files

Drop your **licensed** Google Sans web fonts here, named exactly:

```
public/fonts/GoogleSans-Regular.woff2   (weight 400)
public/fonts/GoogleSans-Bold.woff2      (weight 700)
```

The `@font-face` rules and preload links are already wired up in
`src/styles/global.css` and `src/layouts/Layout.astro`. As soon as these two
files exist, the site renders in Google Sans; until then it falls back to
`system-ui` via the `--font-sans` stack (`font-display: swap`).

## Note on licensing

Google Sans is a proprietary Google typeface and is **not** distributed via the
public Google Fonts CDN. Only add files here if you have the right to use them.
If you don't, switch `--font-sans` in `global.css` to a free alternative such as
Roboto or Inter (both on Google Fonts).
