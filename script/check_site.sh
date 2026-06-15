#!/usr/bin/env bash

set -euo pipefail

grep -q 'site-cover' _includes/archive.html
grep -q 'catalog-table' _includes/archive.html
grep -q 'specimen-grid' _includes/archive.html
grep -q 'post-header__meta' _includes/meta.html
grep -q '\$paper:' _sass/index.sass
grep -q 'album-item__specs' _includes/album-index.html
grep -q 'photo-card__number' _includes/photo-index.html
grep -q 'jekyll-feed' _config.yml

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
  test -f _site/photo/index.html
  test -f _site/about/index.html
  test -f _site/feed.xml
  grep -q 'site-cover' _site/index.html
  grep -q 'catalog-table' _site/index.html
  grep -q 'specimen-grid' _site/index.html
  grep -q 'post-header__meta' _site/code/paint-the-code/index.html
  grep -q 'rel="canonical"' _site/index.html
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
