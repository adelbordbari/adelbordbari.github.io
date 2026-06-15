#!/usr/bin/env bash

set -euo pipefail

grep -q '^url: "https://adelbordbari.github.io"' _config.yml
grep -q 'include seo.html' _layouts/default.html
grep -q 'dir="{{ page_direction }}"' _layouts/default.html
grep -q 'property="og:title"' _includes/seo.html
grep -q 'name="twitter:card"' _includes/seo.html
grep -q 'application/ld+json' _includes/seo.html
grep -q 'include.post.kind == "project"' _includes/meta.html
grep -q 'include.post.source_url' _includes/meta.html
grep -q 'kind: project' _code/2025-12-03-paint-the-code.md
grep -q 'lang: fa' _album/2026-04-15-88-radio-tehran.md
grep -q '\[dir="rtl"\]' _sass/basic.sass
grep -q '@media (prefers-reduced-motion: reduce)' _sass/classes.sass
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

if grep -R -n 'Departure' _sass assets/css; then
  echo "Pixelated Departure font remains in active styles." >&2
  exit 1
fi

non_code_mono_uses=$(grep -R -n '\$font-family-code' _sass | grep -v -E 'code|pre|kbd|samp|rouge|highlight|index.sass' || true)
if test -n "$non_code_mono_uses"; then
  echo "$non_code_mono_uses" >&2
  echo "Code font is used outside code presentation." >&2
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

if grep -R -n -i -E '#e43b2f|#3b44e2|#2d32a7' _sass assets/css; then
  echo "Legacy red/blue theme colors remain in source styles." >&2
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
  grep -q 'catalog-table' _site/index.html
  grep -q 'Benjamin Franklin' _site/index.html
  grep -q 'catalog-kind' _site/index.html
  ! grep -q -E 'cover-specs|specimen-grid' _site/index.html
  grep -q 'post-header__meta' _site/code/paint-the-code/index.html
  grep -q 'artist-index' _site/album/artists/index.html
  grep -q 'The Smiths' _site/album/artists/index.html
  grep -q 'rel="canonical"' _site/index.html
  grep -q 'property="og:title"' _site/index.html
  grep -q 'name="twitter:card"' _site/index.html
  grep -q 'application/ld+json' _site/index.html
  grep -q '<html lang="fa" dir="rtl">' _site/album/88-radio-tehran/index.html
  grep -q 'application/atom+xml' _site/index.html

  if grep -q 'fonts.googleapis.com' _site/assets/css/index.css; then
    echo "External Google Fonts import remains in compiled CSS." >&2
    exit 1
  fi

  if grep -q -i -E '#e43b2f|#3b44e2|#2d32a7' _site/assets/css/index.css; then
    echo "Legacy red/blue theme colors remain in compiled CSS." >&2
    exit 1
  fi
else
  echo "Bundler is unavailable; skipped generated-site checks." >&2
fi

echo "Site acceptance checks passed."
