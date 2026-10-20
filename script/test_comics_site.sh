#!/usr/bin/env bash

set -euo pipefail

site_dir="${1:-_site}"
comic_index="${site_dir}/comics/index.html"
comic_post="${site_dir}/comics/el-nino/index.html"
homepage="${site_dir}/index.html"

test -f "${comic_index}"
test -f "${comic_post}"

grep -q '<h1 id="comic-title">Comics</h1>' "${comic_index}"
grep -q 'class="comic-card__thumbnail"' "${comic_index}"
grep -q 'class="comic-card__body"' "${comic_index}"
grep -q 'class="comic-card__meta"' "${comic_index}"
grep -q '<h1>El Niño</h1>' "${comic_post}"
grep -q 'src="/assets/comics/1_el_nino.jpg"' "${comic_post}"
grep -q 'href="/comics/"' "${homepage}"
grep -q '>Comics</span>' "${homepage}"

if grep -q 'comic-single__caption-text' "${comic_post}"; then
  echo "El Niño must not render an empty caption." >&2
  exit 1
fi

if test -e "${site_dir}/photo/index.html" || test -e "${site_dir}/photos"; then
  echo "Legacy photo routes remain in the generated site." >&2
  exit 1
fi

echo "Comics collection checks passed."
