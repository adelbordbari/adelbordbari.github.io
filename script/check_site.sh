#!/usr/bin/env bash

set -euo pipefail

grep -q 'site-cover' _includes/archive.html
grep -q 'catalog-table' _includes/archive.html
grep -q 'post-header__meta' _includes/meta.html
grep -q '\$paper:' _sass/index.sass
grep -q 'album-item__specs' _includes/album-index.html
grep -q 'photo-card__number' _includes/photo-index.html
grep -q 'jekyll-feed' _config.yml
grep -q 'Benjamin Franklin' _includes/archive.html
grep -q 'catalog-kind' _includes/archive.html
grep -q 'post-content .prose' _sass/basic.sass
grep -q 'max-width: 80ch' _sass/basic.sass
grep -q 'permalink: /album/artists/' album/artists.html
grep -q 'group_by: "artist"' _includes/artist-index.html
grep -q "'/album/artists/' | relative_url" _includes/album-index.html
grep -q 'album-item__rating-spec' _includes/album-index.html
grep -q 'post-header__kind' _includes/meta.html
grep -q 'utility-module--compact .utility-label' _sass/classes.sass
grep -q 'min-height: 3.5rem' _sass/classes.sass
test -f assets/fonts/Vazirmatn-Regular.woff2
grep -q 'font-family: "Vazirmatn"' _sass/font.sass
grep -q '\$font-family-ui:' _sass/index.sass
grep -q '\$font-family-code:' _sass/index.sass
grep -q 'font-weight: 900' _sass/basic.sass
grep -q 'font-stretch: condensed' _sass/basic.sass
grep -q 'backdrop-filter: blur' _sass/classes.sass
grep -q 'site-cover::before' _sass/classes.sass
grep -q 'collection-row__title-track' _includes/simple-collection-index.html
grep -q 'post.title.size > 38' _includes/simple-collection-index.html
grep -q 'collection-row__title--scroll' _sass/classes.sass
grep -q 'animation: title-marquee' _sass/classes.sass
grep -q 'white-space: nowrap' _sass/classes.sass
grep -q 'font-family: \$font-family-serif' _sass/classes.sass
grep -q 'font-size: clamp(1.35rem' _sass/classes.sass
grep -q 'overflow-x: auto' _sass/classes.sass
grep -q 'page-content > .prose > .collection-list' _sass/basic.sass
grep -q 'max-width: none' _sass/basic.sass
grep -q 'artist-index:has(.artist-group:target)' _sass/classes.sass
grep -q 'artist_group.items.size' _includes/artist-index.html
grep -q 'include.post.artist' _includes/meta.html
grep -q 'Artist' _includes/meta.html

if grep -q -E 'artist_group.items.size > 1|artist_albums.size > 1' _includes/artist-index.html _includes/album-index.html; then
  echo "Artist index still excludes single-entry artists." >&2
  exit 1
fi
grep -q 'width: 100%' _sass/basic.sass
grep -q 'page-content > .prose > .collection-list' _sass/basic.sass
grep -q 'id="{{ artist_group.name | strip | slugify }}"' _includes/artist-index.html
grep -q 'artist-group:not(:target)' _sass/classes.sass

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

if grep -q -E 'cover-specs|specimen-grid' _includes/archive.html; then
  echo "Decorative homepage specs or grids remain." >&2
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
