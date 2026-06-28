# Reader Context and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace reader-facing project/article metadata with relative dates and build-time reading estimates, add reversible sticky reading progress to text posts, and support optional photo backstories.

**Architecture:** Reusable Liquid includes emit semantic date, reading-time, and progress markup at build time. One dependency-free deferred browser script progressively formats dates and tracks the active reading region, while existing Sass supplies presentation and the acceptance script verifies generated HTML.

**Tech Stack:** Jekyll/Liquid, HTML, indented Sass, browser JavaScript, Node.js assertions, Bash acceptance checks

---

### Task 1: Add failing acceptance checks for public metadata

**Files:**
- Modify: `script/check_site.sh`
- Test: `script/check_site.sh`

- [ ] **Step 1: Replace the obsolete kind assertions with source-level requirements**

Add these checks after the metadata checks near the top of `script/check_site.sh`:

```bash
grep -q 'include relative-date.html' _includes/meta.html
grep -q 'include reading-time.html' _includes/meta.html
grep -q 'include reading-progress.html' _layouts/post.html
grep -q 'class="reading-region prose"' _layouts/post.html
grep -q 'reader-context.js' _layouts/default.html
grep -q 'relative-time' _includes/relative-date.html
grep -q '200' _includes/reading-time.html

if grep -q -E '>Kind<|>Class<|>Project<|>Article<|>Status<|>Stack<' _includes/meta.html _includes/simple-collection-index.html; then
  echo "Classification-heavy metadata remains reader-facing." >&2
  exit 1
fi
```

Remove these obsolete checks:

```bash
grep -q 'include.post.kind == "project"' _includes/meta.html
grep -q 'include.post.source_url' _includes/meta.html
grep -q 'kind: project' _code/2025-12-03-paint-the-code.md
```

- [ ] **Step 2: Add generated-site assertions inside the Bundler branch**

Add:

```bash
grep -q 'class="relative-time"' _site/index.html
grep -q 'class="reading-time"' _site/code/index.html
grep -q 'class="reading-progress"' _site/code/paint-the-code/index.html
grep -q 'role="progressbar"' _site/code/paint-the-code/index.html
grep -q 'min read' _site/code/paint-the-code/index.html
grep -q 'reader-context.js' _site/code/paint-the-code/index.html
! grep -q -E '>Kind<|>Class<|>Project<|>Article<|>Status<|>Stack<' _site/code/paint-the-code/index.html
! grep -q 'class="reading-progress"' _site/photos/tmp/index.html
```

- [ ] **Step 3: Run the acceptance script and verify RED**

Run: `bash script/check_site.sh`

Expected: FAIL because `_includes/relative-date.html` and the other reading-context files do not exist.

### Task 2: Emit quiet, static-first reader metadata

**Files:**
- Create: `_includes/relative-date.html`
- Create: `_includes/reading-time.html`
- Create: `_includes/reading-progress.html`
- Modify: `_includes/meta.html`
- Modify: `_includes/simple-collection-index.html`
- Modify: `_includes/archive.html`
- Modify: `_includes/album-index.html`
- Modify: `_includes/photo-index.html`
- Modify: `_layouts/post.html`
- Modify: `_layouts/photo.html`
- Modify: `_layouts/default.html`
- Test: `script/check_site.sh`

- [ ] **Step 1: Create semantic date and reading-time includes**

Create `_includes/relative-date.html`:

```liquid
{% assign exact_date_format = site.date_format | default: "%B %d, %Y" -%}
<time class="relative-time" datetime="{{ include.date | date_to_xmlschema }}" title="{{ include.date | date: exact_date_format }}">{{ include.date | date: exact_date_format }}</time>
```

Create `_includes/reading-time.html`:

```liquid
{% assign reading_words = include.content | strip_html | number_of_words -%}
{% assign reading_minutes = reading_words | plus: 199 | divided_by: 200 -%}
{% if reading_minutes < 1 %}{% assign reading_minutes = 1 %}{% endif -%}
<span class="reading-time">{{ reading_minutes }} min read</span>
```

Create `_includes/reading-progress.html`:

```html
<div class="reading-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden>
  <span class="reading-progress__fill"></span>
</div>
```

- [ ] **Step 2: Replace the metadata grid with a compact essential line**

In `_includes/meta.html`, retain collection-label assignment and replace the header body with:

```liquid
<header class="post-header">
  <span class="utility-label">{{ collection_label }}</span>
  <h1 class="page-title">{{ include.post.title }}</h1>
  <div class="post-header__meta">
    {% include relative-date.html date=include.post.date %}
    {% include reading-time.html content=include.content %}
    {% if collection_name == "album" and include.post.artist %}
      {% assign artist_name = include.post.artist | strip %}
      {% assign artist_slug = artist_name | slugify %}
      <a href="{{ '/album/artists/' | relative_url }}#{{ artist_slug }}">{{ artist_name }}</a>
    {% endif %}
    {% if include.post.rating %}<span>{{ include.post.rating }}</span>{% endif %}
  </div>
</header>
```

Pass `content=content` from `_layouts/post.html`, include reading progress above the article, and mark the prose as the reading region:

```liquid
{% include reading-progress.html %}
<article class="post-content" lang="{{ page.lang | default: site.lang }}" dir="{{ page.dir | default: page_direction }}">
  {% include meta.html post=page content=content %}
  ...
  <div class="reading-region prose">
    {{ content }}
  </div>
  ...
</article>
```

- [ ] **Step 3: Replace repeated exact dates and collection kind with the includes**

In `_includes/simple-collection-index.html`, render:

```liquid
{% include relative-date.html date=post.date %}
<a class="collection-row__title{% if post.title.size > 38 %} collection-row__title--scroll{% endif %}" href="{{ post.url | relative_url }}">
  <span class="collection-row__title-track">{{ post.title }}</span>
</a>
{% include reading-time.html content=post.content %}
```

In `_includes/archive.html`, replace the existing `<time>` with:

```liquid
<span role="cell" data-label="Filed">{% include relative-date.html date=post.date %}</span>
```

In `_includes/album-index.html`, replace the Filed `<dd>` content with:

```liquid
{% include relative-date.html date=post.date %}
```

In `_includes/photo-index.html`, replace the `<small>` content with:

```liquid
{% include relative-date.html date=post.date %}
```

- [ ] **Step 4: Make photo backstories opt in through non-empty Markdown**

At the top of `_layouts/photo.html`, derive text presence:

```liquid
{% assign backstory_text = content | strip_html | strip -%}
{% assign has_backstory = false -%}
{% if backstory_text != "" %}{% assign has_backstory = true %}{% endif -%}
```

Before `.photo-page`, conditionally emit progress:

```liquid
{% if has_backstory %}{% include reading-progress.html %}{% endif %}
```

Replace the caption date and notes block with:

```liquid
<p>
  {% include relative-date.html date=page.date %}
  {% if has_backstory %}{% include reading-time.html content=content %}{% endif %}
</p>
...
{% if has_backstory %}
  <div class="photo-single__notes reading-region prose">
    {{ content }}
  </div>
{% endif %}
```

- [ ] **Step 5: Load one deferred enhancement asset globally**

Add before `</head>` in `_layouts/default.html`:

```html
<script defer src="{{ '/assets/js/reader-context.js' | relative_url }}"></script>
```

- [ ] **Step 6: Run the acceptance script and inspect the remaining failure**

Run: `bash script/check_site.sh`

Expected: source template checks pass; generated checks fail because JavaScript and progress styling are not implemented yet.

### Task 3: Implement relative dates and reversible reading progress with TDD

**Files:**
- Create: `script/test_reader_context.js`
- Create: `assets/js/reader-context.js`
- Test: `script/test_reader_context.js`

- [ ] **Step 1: Write focused failing JavaScript tests**

Create `script/test_reader_context.js`:

```javascript
'use strict';

const assert = require('node:assert/strict');
const {
  calculateProgress,
  relativeDateValue,
  relativeDateText
} = require('../assets/js/reader-context.js');

const now = new Date('2026-06-28T12:00:00Z');
assert.deepEqual(relativeDateValue(new Date('2026-06-28T08:00:00Z'), now), { value: 0, unit: 'day' });
assert.deepEqual(relativeDateValue(new Date('2026-06-27T08:00:00Z'), now), { value: -1, unit: 'day' });
assert.deepEqual(relativeDateValue(new Date('2024-06-26T12:00:00Z'), now), { value: -2, unit: 'year' });
assert.equal(relativeDateText({ value: -2, unit: 'year' }, 'en'), '2 years ago');
assert.equal(calculateProgress(200, 800, 200, 1800), 0);
assert.equal(calculateProgress(700, 800, 200, 1800), 50);
assert.equal(calculateProgress(1200, 800, 200, 1800), 100);
assert.equal(calculateProgress(700, 800, 200, 1800) > calculateProgress(500, 800, 200, 1800), true);
assert.equal(calculateProgress(300, 800, 200, 1800) < calculateProgress(500, 800, 200, 1800), true);

console.log('Reader context unit checks passed.');
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `node script/test_reader_context.js`

Expected: FAIL with `Cannot find module '../assets/js/reader-context.js'`.

- [ ] **Step 3: Implement the dependency-free enhancement module**

Create `assets/js/reader-context.js`:

```javascript
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.init(root.document, root);
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const DAY = 86400000;

  function signedRound(value) {
    return Math.sign(value) * Math.round(Math.abs(value));
  }

  function relativeDateValue(date, now) {
    const days = (date.getTime() - now.getTime()) / DAY;
    const absoluteDays = Math.abs(days);
    if (absoluteDays < 1) return { value: 0, unit: 'day' };
    if (absoluteDays < 30) return { value: signedRound(days), unit: 'day' };
    if (absoluteDays < 365) return { value: signedRound(days / 30), unit: 'month' };
    return { value: signedRound(days / 365), unit: 'year' };
  }

  function relativeDateText(relative, locale) {
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      return new Intl.RelativeTimeFormat(locale || 'en', { numeric: 'auto' })
        .format(relative.value, relative.unit);
    }
    if (relative.value === 0) return 'today';
    const count = Math.abs(relative.value);
    const unit = relative.unit + (count === 1 ? '' : 's');
    return relative.value < 0 ? `${count} ${unit} ago` : `in ${count} ${unit}`;
  }

  function calculateProgress(scrollY, viewportHeight, regionTop, regionHeight) {
    const distance = Math.max(regionHeight - viewportHeight, 1);
    const progress = ((scrollY - regionTop) / distance) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  function enhanceDates(document, now) {
    document.querySelectorAll('.relative-time[datetime]').forEach(function (time) {
      const date = new Date(time.dateTime);
      if (Number.isNaN(date.getTime())) return;
      const locale = document.documentElement.lang || 'en';
      time.textContent = relativeDateText(relativeDateValue(date, now), locale);
    });
  }

  function enhanceProgress(document, window) {
    const progress = document.querySelector('.reading-progress');
    const region = document.querySelector('.reading-region');
    if (!progress || !region) return;
    const fill = progress.querySelector('.reading-progress__fill');
    let queued = false;

    function update() {
      const rect = region.getBoundingClientRect();
      const regionTop = rect.top + window.scrollY;
      const value = calculateProgress(window.scrollY, window.innerHeight, regionTop, rect.height);
      fill.style.transform = `scaleX(${value / 100})`;
      progress.setAttribute('aria-valuenow', String(Math.round(value)));
      queued = false;
    }

    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    progress.hidden = false;
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function init(document, window) {
    enhanceDates(document, new Date());
    enhanceProgress(document, window);
  }

  return { calculateProgress, enhanceDates, enhanceProgress, init, relativeDateText, relativeDateValue };
}));
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run: `node script/test_reader_context.js`

Expected: `Reader context unit checks passed.`

### Task 4: Fit progress and compact metadata into the existing design

**Files:**
- Modify: `_sass/basic.sass`
- Modify: `_sass/classes.sass`
- Test: `script/check_site.sh`

- [ ] **Step 1: Replace the old metadata-grid rules in `_sass/basic.sass`**

Use a wrapping inline row with rule separators:

```sass
.post-header__meta
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: .45rem
  color: $muted
  font-family: $font-family-ui
  font-size: .8rem

.post-header__meta > *
  min-width: 0

.post-header__meta > * + *::before
  content: "·"
  margin-right: .45rem
  color: $accent

.post-header__meta a
  color: inherit
```

Remove obsolete `.post-header__kind`, `.post-header__meta--album`, nth-child grid, and mobile metadata-grid rules.

- [ ] **Step 2: Add top-edge progress and backstory styles in `_sass/basic.sass`**

```sass
.reading-progress
  position: fixed
  inset: 0 0 auto
  z-index: 100
  height: 3px
  overflow: hidden
  background: rgba($ink, .22)

.reading-progress[hidden]
  display: none

.reading-progress__fill
  width: 100%
  height: 100%
  display: block
  transform: scaleX(0)
  transform-origin: left center
  background: $accent
  will-change: transform

.photo-single__notes
  max-width: 42rem
  margin: clamp(2rem, 6vw, 4rem) auto 0
```

Under the existing reduced-motion media query, ensure the fill has no transition:

```sass
.reading-progress__fill
  transition: none
```

- [ ] **Step 3: Rename the collection-list metadata selector in `_sass/classes.sass`**

Replace `.collection-row__kind` selectors with `.reading-time` where they style the third column, retain muted UI typography, and remove kind-specific naming. Keep the existing three-column responsive layout.

- [ ] **Step 4: Run Sass compilation and acceptance checks**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index.css`

Expected: exit 0.

Run: `node script/test_reader_context.js && bash script/check_site.sh`

Expected: the Node message and `Site acceptance checks passed.`

### Task 5: Verify requirements and generated output

**Files:**
- Modify: `script/check_site.sh`
- Test: `script/test_reader_context.js`
- Test: `script/check_site.sh`

- [ ] **Step 1: Add the JavaScript unit check to the acceptance entry point**

Near the beginning of `script/check_site.sh`, add:

```bash
if command -v node >/dev/null 2>&1; then
  node script/test_reader_context.js
else
  echo "Node is unavailable; skipped reader-context unit checks." >&2
fi
```

- [ ] **Step 2: Run the complete verification suite from a clean generated site**

Run: `bundle exec jekyll clean && node script/test_reader_context.js && bash script/check_site.sh`

Expected: Jekyll builds successfully, unit checks pass, and acceptance output ends with `Site acceptance checks passed.`

- [ ] **Step 3: Inspect representative generated markup**

Run:

```bash
rg -n 'relative-time|reading-time|reading-progress|Published|Kind|Class|Project|Article' \
  _site/code/paint-the-code/index.html \
  _site/album/innervisions-stevie-wonder/index.html \
  _site/photos/tmp/index.html \
  _site/index.html
```

Expected: text posts contain relative-time fallback, reading time, and one progressbar; the image-only photo contains a relative date but no progressbar; none of the removed reader-facing labels appear.

- [ ] **Step 4: Review the final diff without disturbing user content**

Run: `git diff --check && git status --short && git diff -- _includes _layouts _sass assets/js script`

Expected: no whitespace errors; only implementation and test files appear alongside the user's pre-existing post changes.
