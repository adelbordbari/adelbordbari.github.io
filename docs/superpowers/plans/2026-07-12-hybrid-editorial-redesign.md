# Hybrid Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the sitewide Jekyll theme in the approved Hybrid Editorial direction while preserving real content, routes, widgets, bilingual reading comfort, and responsive behavior.

**Architecture:** Keep the existing Liquid layout structure and drive the redesign through the established Sass partials. Use targeted template edits only where the graphic system needs semantic hooks, and rely on the existing verification scripts plus a production build to ensure the redesign stays presentational rather than architectural.

**Tech Stack:** Jekyll, Liquid, indented Sass, locally hosted fonts, dependency-light JavaScript, Bash verification scripts

## Global Constraints

- Keep the existing Jekyll, Liquid, and Sass architecture.
- Reuse the current layouts, includes, collections, routes, and widgets.
- Do not add new collections, client-side dependencies, synthetic metadata, dummy copy, fake codes, or decorative text content.
- Use the palette language from the references directly.
- Accent colors are not used as broad brand washes.
- Persian text uses locally hosted Vazirmatn throughout.
- Decorative marks must stay out of the accessibility tree and never carry meaning that is unavailable in text.
- Preserve and strengthen semantic landmarks, the skip link, visible keyboard focus, sufficient contrast, correct `lang` and `dir`, reduced-motion behavior, readable line length, and mobile layouts without page-level horizontal overflow.

---

## File Map

- Modify `_sass/index.sass`: redesign tokens for color, type, and motion.
- Modify `_sass/font.sass`: ensure the local Latin mono and Persian font roles are explicit.
- Modify `_sass/basic.sass`: global surfaces, typography, prose, article headers, utilities, and accessibility states.
- Modify `_sass/layout.sass`: site frame, header, navigation, footer, and mobile shell behavior.
- Modify `_sass/classes.sass`: homepage hero, archive/table modules, activity widgets, albums, pagination, and photo presentations.
- Modify `_includes/home.html`: preserve real content while adding graphic-system hooks for the homepage composition.
- Modify `_layouts/default.html`: if needed, add decorative shell hooks that do not introduce fake text.
- Modify `_layouts/page.html`: strengthen the page header framing.
- Modify `_includes/meta.html`: strengthen post/article header framing and metadata grouping.
- Modify `_includes/archive.html`: preserve archive data while aligning list structure and labels with the system.
- Modify `script/check_site.sh`: if current acceptance checks conflict with the approved visual direction, update them to verify the new contract instead.

### Task 1: Lock The Theme Contract First

**Files:**
- Modify: `script/check_site.sh`
- Test: `script/check_site.sh`

**Interfaces:**
- Consumes: Existing source checks and Jekyll build flow in `script/check_site.sh`
- Produces: Acceptance checks that guard against fake copy, missing Vazirmatn support, missing mono-forward theme tokens, and missing responsive build output

- [ ] **Step 1: Write the failing acceptance checks**

Add checks for the new theme contract:

```bash
grep -q '\$font-family-mono: "Departure Mono"' _sass/index.sass
grep -q '\$font-family-fa: "Vazirmatn"' _sass/index.sass
grep -q 'site-cover' _sass/classes.sass
grep -q 'site-cover' _includes/home.html

if grep -q -E 'system-ready|specimen text|fictional|dummy copy|fake codes' _includes/*.html _layouts/*.html; then
  echo "Fake decorative copy is present in public templates." >&2
  exit 1
fi
```

- [ ] **Step 2: Run the contract to verify RED**

Run: `bash script/check_site.sh`

Expected: FAIL because the current theme does not yet satisfy the new token and structure checks.

- [ ] **Step 3: Commit the test contract**

```bash
git add script/check_site.sh
git commit -m "test: lock hybrid editorial theme contract"
```

### Task 2: Redesign Tokens, Fonts, And Global Reading Surfaces

**Files:**
- Modify: `_sass/index.sass`
- Modify: `_sass/font.sass`
- Modify: `_sass/basic.sass`
- Test: `script/check_site.sh`

**Interfaces:**
- Consumes: Theme contract from Task 1
- Produces: Shared design tokens, global typography rules, RTL-aware prose styling, accessible focus/selection states, and sitewide decorative primitives

- [ ] **Step 1: Write the failing visual token check**

Add or keep a token assertion that expects the darker palette and mono-forward system:

```bash
grep -q '\$paper: #050505' _sass/index.sass
grep -q '\$ink: #f5f3ee' _sass/index.sass
grep -q '\$font-family-mono: "Departure Mono"' _sass/index.sass
```

Run: `bash script/check_site.sh`

Expected: FAIL because the old palette values still exist.

- [ ] **Step 2: Write the minimal token implementation**

Implement the shared token direction in `_sass/index.sass`:

```sass
$font-family-display: "Departure Mono", "SFMono-Regular", Consolas, monospace !default
$font-family-ui: "Departure Mono", "SFMono-Regular", Consolas, monospace !default
$font-family-mono: "Departure Mono", "SFMono-Regular", Consolas, monospace !default
$font-family-fa: "Vazirmatn", Tahoma, sans-serif !default

$paper: #050505 !default
$sheet: #0b0b0d !default
$raised: #111215 !default
$ink: #f5f3ee !default
$muted: #a4a4aa !default
$rule: #303036 !default
$rule-strong: #6a6a72 !default
```

- [ ] **Step 3: Extend the global styles**

Implement the hybrid editorial system in `_sass/basic.sass` using:

```sass
body
  background-color: $paper
  color: $ink
  font-family: $font-family

h1, h2, h3, h4, h5, h6
  font-family: $font-family-display
  text-transform: uppercase

a
  color: $ink
  text-decoration-color: rgba($ink, .65)

*:focus-visible
  outline: 2px solid #fff
  outline-offset: 3px

[dir="rtl"] .prose,
[dir="rtl"] .page-header,
[dir="rtl"] .post-header
  font-family: $font-family-fa
```

- [ ] **Step 4: Run the narrow compilation check**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-hybrid.css`

Expected: PASS and `/tmp/adel-hybrid.css` contains `Departure Mono`, `Vazirmatn`, and the new near-black palette.

- [ ] **Step 5: Commit**

```bash
git add _sass/index.sass _sass/font.sass _sass/basic.sass
git commit -m "feat: add hybrid editorial theme tokens"
```

### Task 3: Rebuild The Site Shell And Homepage Composition

**Files:**
- Modify: `_sass/layout.sass`
- Modify: `_sass/classes.sass`
- Modify: `_includes/home.html`
- Modify: `_layouts/default.html`
- Test: `script/check_site.sh`

**Interfaces:**
- Consumes: Shared tokens and global styles from Task 2
- Produces: Poster-like site frame, technical control-strip header, homepage calibration composition, and responsive shell behavior

- [ ] **Step 1: Write the failing homepage structure check**

Add a structure assertion:

```bash
grep -q 'site-cover__primary' _includes/home.html
grep -q 'site-cover__secondary' _includes/home.html
grep -q 'utility-grid' _includes/home.html
```

Run: `bash script/check_site.sh`

Expected: FAIL because the homepage markup does not yet expose the exact composition hooks.

- [ ] **Step 2: Implement the homepage composition hooks**

Update `_includes/home.html` while keeping only real content:

```liquid
<section class="site-cover" aria-labelledby="cover-title">
  <div class="site-cover__primary">
    <span class="utility-label">Independent web notebook</span>
    <h1 id="cover-title">{{ site.title }}</h1>
    <p class="site-cover__intro">Field notes from the web: code, records, photographs, reviews, and personal writing.</p>
    <div class="site-cover__calibration" aria-hidden="true"></div>
  </div>
  <div class="site-cover__secondary">
    <blockquote class="cover-quote">
      <p>Perhaps if I make myself write I shall find out what is wrong with me.</p>
      <cite>Dodie smith</cite>
    </blockquote>
  </div>
</section>
```

- [ ] **Step 3: Implement the shell and homepage styles**

Use `_sass/layout.sass` and `_sass/classes.sass` to create:

```sass
.site-sheet
  width: min(92rem, 100%)
  border: 1px solid $rule

.site-header
  border-bottom: 1px solid $rule

.site-cover
  display: grid
  grid-template-columns: minmax(0, 1.2fr) minmax(18rem, .8fr)

.site-cover__calibration
  height: .9rem
  background: linear-gradient(90deg, #d92c2c 0 12%, #2fa84f 12% 24%, #2077d6 24% 36%, #f2d22e 36% 48%, #d84cc6 48% 60%, #fff 60% 100%)
```

- [ ] **Step 4: Verify GREEN**

Run: `bash script/check_site.sh`

Expected: PASS for the new homepage/source assertions, with any remaining failures limited to unfinished shared component styling.

- [ ] **Step 5: Commit**

```bash
git add _includes/home.html _layouts/default.html _sass/layout.sass _sass/classes.sass
git commit -m "feat: rebuild shell and homepage in hybrid editorial style"
```

### Task 4: Unify Archives, Post Headers, Prose, Albums, And Photos

**Files:**
- Modify: `_includes/archive.html`
- Modify: `_includes/meta.html`
- Modify: `_layouts/page.html`
- Modify: `_sass/basic.sass`
- Modify: `_sass/classes.sass`
- Test: `script/check_site.sh`

**Interfaces:**
- Consumes: Theme shell and homepage system from Task 3
- Produces: Consistent list/table modules, stronger article/page headers, calmer long-form reading zones, and indexed media presentations

- [ ] **Step 1: Write the failing archive/article contract**

Add assertions for the strengthened structural selectors:

```bash
grep -q 'post-header__meta' _includes/meta.html
grep -q 'collection-row' _includes/archive.html
grep -q 'page-header' _layouts/page.html
```

Run: `bash script/check_site.sh`

Expected: FAIL if any selector or structure is missing after the redesign adjustments.

- [ ] **Step 2: Implement the minimal template changes**

Preserve existing data and make only structural improvements, such as:

```liquid
<header class="page-header">
  <span class="utility-label">Filed section / {{ page.title }}</span>
  <h1>{{ page.title }}</h1>
</header>
```

and:

```liquid
<div class="post-header__meta">
  {{ existing metadata output }}
</div>
```

- [ ] **Step 3: Implement the shared component styling**

Use `_sass/basic.sass` and `_sass/classes.sass` to create:

```sass
.page-header,
.post-header
  border-top: 1px solid $rule
  border-bottom: 1px solid $rule

.catalog-row,
.collection-row,
.artist-albums li
  border-bottom: 1px solid $rule
  font-family: $font-family-mono

.photo-card,
.album-item,
.utility-module
  background: $raised
  border: 1px solid $rule
```

- [ ] **Step 4: Verify GREEN**

Run: `bash script/check_site.sh`

Expected: PASS for source checks and generated output, with no fake copy or broken structure introduced by the redesign.

- [ ] **Step 5: Commit**

```bash
git add _includes/archive.html _includes/meta.html _layouts/page.html _sass/basic.sass _sass/classes.sass
git commit -m "feat: apply hybrid editorial system to archives and articles"
```

### Task 5: Full Verification And Final Polish

**Files:**
- Modify if necessary: `_sass/basic.sass`
- Modify if necessary: `_sass/layout.sass`
- Modify if necessary: `_sass/classes.sass`
- Modify if necessary: `script/check_site.sh`

**Interfaces:**
- Consumes: Completed redesign implementation from Tasks 1-4
- Produces: Verified, responsive, bilingual, production-build-ready redesign

- [ ] **Step 1: Run the reader-context test**

Run: `node script/test_reader_context.js`

Expected: `Reader context tests passed.`

- [ ] **Step 2: Run Sass compilation**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-hybrid.css`

Expected: PASS with no Sass errors.

- [ ] **Step 3: Run the full acceptance/build script**

Run: `bash script/check_site.sh`

Expected: PASS with the generated build succeeding and theme contract checks satisfied.

- [ ] **Step 4: Inspect final diff health**

Run: `git diff --check && git diff --stat && git status --short`

Expected: No whitespace errors and only the intended redesign files changed, apart from any pre-existing user edits.

- [ ] **Step 5: Commit**

```bash
git add _sass/index.sass _sass/font.sass _sass/basic.sass _sass/layout.sass _sass/classes.sass _includes/home.html _includes/archive.html _includes/meta.html _layouts/default.html _layouts/page.html script/check_site.sh
git commit -m "feat: implement hybrid editorial redesign"
```
