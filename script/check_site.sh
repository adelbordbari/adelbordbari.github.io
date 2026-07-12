#!/usr/bin/env bash

set -euo pipefail

if command -v node >/dev/null 2>&1; then
  node script/test_reader_context.js
else
  echo "Node is unavailable; skipped reader-context unit checks." >&2
fi

grep -q '^url: "https://adelbordbari.github.io"' _config.yml
grep -q 'include seo.html' _layouts/default.html
grep -q 'dir="{{ page_direction }}"' _layouts/default.html
grep -q 'property="og:title"' _includes/seo.html
grep -q 'name="twitter:card"' _includes/seo.html
grep -q 'application/ld+json' _includes/seo.html
grep -q 'include relative-date.html' _includes/meta.html
grep -q 'include reading-time.html' _includes/meta.html
grep -q 'include reading-progress.html' _layouts/post.html
grep -q 'class="reading-region prose"' _layouts/post.html
grep -q 'has_backstory' _layouts/photo.html
grep -q 'photo-single__notes reading-region prose' _layouts/photo.html
grep -q 'grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr)' _sass/classes.sass
grep -q 'grid-template-columns: 8.5rem minmax(0, 1fr) 8rem' _sass/classes.sass
grep -q 'grid-template-columns: 7.75rem minmax(0, 1fr)' _sass/classes.sass
grep -q 'page.caption' _layouts/photo.html
grep -q 'photo-single__caption-text' _layouts/photo.html
grep -q '^caption:' _photos/2026-06-07-tmp.md
grep -q 'reader-context.js' _layouts/default.html
grep -q 'mermaid-diagrams.mjs' _layouts/default.html
grep -q 'cdn.jsdelivr.net/npm/mermaid' _layouts/default.html
grep -q 'relative-time' _includes/relative-date.html
grep -q '200' _includes/reading-time.html
grep -q 'calculateProgress' assets/js/reader-context.js
grep -q 'prepareMermaidDiagrams' assets/js/mermaid-diagrams.mjs
grep -q 'reading-progress__fill' _sass/basic.sass
grep -q '.photo-single__meta' _sass/classes.sass
grep -q 'lang: fa' _album/2026-04-15-88-radio-tehran.md
grep -q '\[dir="rtl"\]' _sass/basic.sass
grep -q '@media (prefers-reduced-motion: reduce)' _sass/classes.sass
grep -q '@media (max-width: 30rem)' _sass/layout.sass
grep -q 'overflow-wrap: anywhere' _sass/basic.sass
grep -q '\.mermaid' _sass/basic.sass
grep -q 'figcaption' _sass/basic.sass
grep -q 'grid-template-columns: 1fr' _sass/classes.sass
grep -q 'View my Last.fm profile' _includes/lastfm.html
grep -q 'View my Letterboxd profile' _includes/letterboxd.html
grep -q 'noscript' _includes/lastfm.html
grep -q 'noscript' _includes/letterboxd.html
grep -q 'Benjamin Franklin' _includes/archive.html
grep -q 'catalog-table' _includes/archive.html
grep -q 'album-item__specs' _includes/album-index.html
grep -q 'photo-card__number' _includes/photo-index.html
grep -q 'permalink: /album/artists/' album/artists.html
test -f assets/fonts/Vazirmatn-Regular.woff2
test -f assets/fonts/DepartureMono-Regular.woff2
grep -q '\$paper: #17191c' _sass/index.sass
grep -q '\$sheet: #1d2024' _sass/index.sass
grep -q '\$raised: #24282d' _sass/index.sass
grep -q '\$ink: #c9c8c2' _sass/index.sass
grep -q '\$muted: #92969b' _sass/index.sass
grep -q '\$rule: #3d4248' _sass/index.sass
grep -q '\$rule-strong: #555b62' _sass/index.sass
grep -q '\$accent-red: #e43b2f' _sass/index.sass
grep -q '\$accent-blue: #3b44e2' _sass/index.sass
grep -q 'font-family: "Departure Mono"' _sass/font.sass
grep -q 'site-cover__primary' _includes/archive.html
grep -q 'site-cover__secondary' _includes/archive.html
grep -q 'site-cover__mark" aria-hidden="true"' _includes/archive.html

if rg -n '```[A-Za-z0-9_+-]+ id="' _code _etc _album _photos >/dev/null; then
  echo "Nonstandard fenced code block attributes remain in markdown content." >&2
  exit 1
fi

if grep -q -E '>Kind<|>Class<|>Project<|>Article<|>Status<|>Stack<' _includes/meta.html _includes/simple-collection-index.html; then
  echo "Classification-heavy metadata remains reader-facing." >&2
  exit 1
fi

if grep -q -E 'site-cover__issue|barcode-divider|REF-' _includes/archive.html _includes/simple-collection-index.html; then
  echo "Artificial issue, barcode, or reference labels remain." >&2
  exit 1
fi

if grep -q 'photo-hero__kicker' _includes/photo-index.html; then
  echo "Photo archive kicker remains." >&2
  exit 1
fi

if grep -R -n -E '^:{1,2}[a-zA-Z-]+' _sass assets/css --include='*.sass'; then
  echo "Top-level pseudo selectors must be prefixed for legacy GitHub Pages Sass." >&2
  exit 1
fi

if grep -q 'photo-marquee' _includes/photo-index.html; then
  echo "Legacy photo marquee remains in the photo index." >&2
  exit 1
fi

if grep -R -n 'fonts.googleapis.com' _sass assets/css; then
  echo "External Google Fonts import remains in source styles." >&2
  exit 1
fi

if grep -q -E 'REF-|coordinates|system-ready|version-label' _includes/archive.html _layouts/*.html; then
  echo "Fictional technical metadata is reader-facing." >&2
  exit 1
fi

if command -v bundle >/dev/null 2>&1; then
  bundle exec jekyll build

  test -f _site/index.html
  test -f _site/code/index.html
  test -f _site/etc/index.html
  test -f _site/album/index.html
  test -f _site/album/artists/index.html
  test -f _site/photo/index.html
  test -f _site/about/index.html
  test -f _site/feed.xml
  grep -q 'site-cover' _site/index.html
  grep -q 'site-cover__primary' _site/index.html
  grep -q 'site-cover__secondary' _site/index.html
  grep -q 'site-cover__mark" aria-hidden="true"' _site/index.html
  grep -q 'catalog-table' _site/index.html
  grep -q 'Benjamin Franklin' _site/index.html
  grep -q 'catalog-kind' _site/index.html
  ! grep -q -E 'cover-specs|specimen-grid' _site/index.html
  grep -q 'post-header__meta' _site/code/paint-the-code/index.html
  grep -q 'class="relative-time"' _site/index.html
  grep -q 'class="reading-time"' _site/code/index.html
  grep -q 'class="reading-progress"' _site/code/paint-the-code/index.html
  grep -q 'role="progressbar"' _site/code/paint-the-code/index.html
  grep -q 'min read' _site/code/paint-the-code/index.html
  grep -q 'reader-context.js' _site/code/paint-the-code/index.html
  grep -q 'mermaid-diagrams.mjs' _site/code/paint-the-code/index.html
  grep -q 'cdn.jsdelivr.net/npm/mermaid' _site/code/paint-the-code/index.html
  ! grep -q -E '>Kind<|>Class<|>Project<|>Article<|>Status<|>Stack<' _site/code/paint-the-code/index.html
  grep -q 'class="reading-progress"' _site/photos/tmp/index.html
  grep -q 'class="reading-time"' _site/photos/tmp/index.html
  grep -q 'artist-index' _site/album/artists/index.html
  grep -q 'The Smiths' _site/album/artists/index.html
  grep -q 'rel="canonical"' _site/index.html
  grep -q 'property="og:title"' _site/index.html
  grep -q 'name="twitter:card"' _site/index.html
  grep -q 'application/ld+json' _site/index.html
  grep -q '<html lang="fa" dir="rtl">' _site/album/88-radio-tehran/index.html
  grep -q 'photo-single__caption-text' _site/photos/tmp/index.html
  grep -q 'photo-single__notes reading-region prose' _site/photos/tmp/index.html
  grep -q 'application/atom+xml' _site/index.html

  if grep -q 'fonts.googleapis.com' _site/assets/css/index.css; then
    echo "External Google Fonts import remains in compiled CSS." >&2
    exit 1
  fi

  grep -qi '#e43b2f' _site/assets/css/index.css
  grep -qi '#3b44e2' _site/assets/css/index.css
  grep -q 'Departure Mono' _site/assets/css/index.css
else
  echo "Bundler is unavailable; skipped generated-site checks." >&2
fi

echo "Site acceptance checks passed."
