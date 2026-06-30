# Technical Archive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the complete Jekyll site in the approved Field Archive direction while preserving content, routes, widgets, bilingual readability, and reader functionality.

**Architecture:** Keep the existing Liquid templates and five Sass partials. Introduce semantic red/blue and mono-interface tokens in `_sass/index.sass`, expose them as CSS custom properties in `_sass/basic.sass`, add only a few purposeful homepage hooks in `_includes/archive.html`, and apply the shared archive language through the existing shell and component selectors. Use the repository acceptance script as the contract for source tokens, generated markup, accessibility, and production output.

**Tech Stack:** Jekyll, Liquid, indented Sass, locally hosted fonts, dependency-free JavaScript, Bash acceptance checks

---

## File Map

- Modify `_sass/index.sass`: color, typography, and compatibility tokens.
- Modify `_sass/font.sass`: register the existing Departure Mono asset for interface labels and code.
- Modify `_sass/basic.sass`: global surfaces, typography, prose, focus, media, article headers, RTL, and code presentation.
- Modify `_sass/layout.sass`: site shell, header, navigation, footer, and mobile shell.
- Modify `_sass/classes.sass`: homepage, archive rows, widgets, albums, artists, pagination, and photos.
- Modify `_includes/archive.html`: semantic split-hero hooks and one decorative, assistive-technology-hidden mark.
- Modify `_layouts/page.html`: expose the page heading as a structured archive header.
- Modify `script/check_site.sh`: replace obsolete palette/font prohibitions with Field Archive acceptance checks.
- Create `docs/superpowers/plans/2026-06-30-technical-archive-redesign.md`: execution record.

### Task 1: Lock The Field Archive Contract

**Files:**
- Modify: `script/check_site.sh:36-88`
- Modify: `script/check_site.sh:101-131`

- [ ] **Step 1: Replace obsolete theme prohibitions with source assertions**

Require the established colors, locally hosted mono face, semantic hero hooks,
and meaningful metadata while retaining the no-fictional-label guard:

```bash
grep -q '\$accent-red: #e43b2f' _sass/index.sass
grep -q '\$accent-blue: #3b44e2' _sass/index.sass
grep -q 'font-family: "Departure Mono"' _sass/font.sass
grep -q 'site-cover__primary' _includes/archive.html
grep -q 'site-cover__secondary' _includes/archive.html
grep -q 'site-cover__mark" aria-hidden="true"' _includes/archive.html

if grep -q -E 'REF-|coordinates|system-ready|version-label' _includes/archive.html _layouts/*.html; then
  echo "Fictional technical metadata is reader-facing." >&2
  exit 1
fi
```

- [ ] **Step 2: Add generated-site assertions**

After the Jekyll build, require new markup and compiled brand colors:

```bash
grep -q 'site-cover__primary' _site/index.html
grep -q 'site-cover__secondary' _site/index.html
grep -q 'site-cover__mark" aria-hidden="true"' _site/index.html
grep -qi '#e43b2f' _site/assets/css/index.css
grep -qi '#3b44e2' _site/assets/css/index.css
grep -q 'Departure Mono' _site/assets/css/index.css
```

- [ ] **Step 3: Run acceptance checks and verify the new contract fails**

Run: `bash script/check_site.sh`

Expected: FAIL at the first missing `$accent-red`, `$accent-blue`, or hero-hook assertion.

### Task 2: Implement Tokens, Fonts, And Global Reading Styles

**Files:**
- Modify: `_sass/index.sass:1-33`
- Modify: `_sass/font.sass:1-34`
- Modify: `_sass/basic.sass:1-435`

- [ ] **Step 1: Add semantic design tokens**

Use this token model in `_sass/index.sass`:

```sass
$font-family-mono: "Departure Mono", "SFMono-Regular", Consolas, monospace !default
$font-family-code: $font-family-mono !default
$paper: #07080a !default
$sheet: #0d0f12 !default
$raised: #12151a !default
$ink: #f0eee7 !default
$muted: #a5a8af !default
$rule: #343840 !default
$rule-strong: #5a606b !default
$accent-red: #e43b2f !default
$accent-blue: #3b44e2 !default
$accent: $accent-red !default
```

- [ ] **Step 2: Register the local mono font**

Prepend this face to `_sass/font.sass`:

```sass
@font-face
  font-family: "Departure Mono"
  src: url("../fonts/DepartureMono-Regular.woff2") format("woff2")
  font-weight: 400
  font-style: normal
  font-display: swap
```

- [ ] **Step 3: Apply global Field Archive presentation**

Update `_sass/basic.sass` so CSS properties expose both accents, body texture is
a faint square grid plus noise, selection/progress use red, focus uses blue,
links use blue with red hover, and headings use the tall display stack. Keep
English body copy in PT Serif and Persian content in Vazirmatn. Style tables,
blockquote rules, inline code, code blocks, article metadata, covers, and syntax
colors exclusively from neutral/red/blue tokens.

Key declarations:

```sass
html
  --accent-red: #{$accent-red}
  --accent-blue: #{$accent-blue}

*:focus-visible
  outline: 2px solid $accent-blue

a
  text-decoration-color: $accent-blue

a:hover
  color: $accent-red

.utility-label,
.post-header__meta,
figcaption
  font-family: $font-family-mono
```

- [ ] **Step 4: Compile Sass directly**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index.css`

Expected: exit 0 and `/tmp/adel-index.css` contains `#e43b2f`, `#3b44e2`, and `Departure Mono`.

### Task 3: Build The Shell And Homepage Composition

**Files:**
- Modify: `_includes/archive.html:1-70`
- Modify: `_layouts/page.html:5-9`
- Modify: `_sass/layout.sass:1-117`
- Modify: `_sass/classes.sass:1-293`

- [ ] **Step 1: Introduce semantic split-hero markup**

Keep all existing copy and use this structure in `_includes/archive.html`:

```html
<section class="site-cover" aria-labelledby="cover-title">
  <div class="site-cover__primary">
    <span class="utility-label">Independent web notebook</span>
    <h1 id="cover-title">{{ site.title }}</h1>
    <p class="site-cover__intro">Field notes from the web: code, records, photographs, reviews, and personal writing.</p>
    <span class="site-cover__mark" aria-hidden="true"></span>
  </div>
  <div class="site-cover__secondary">
    <blockquote class="cover-quote">
      <p>Either write things worth reading, or do things worth the writing.</p>
      <cite>Benjamin Franklin</cite>
    </blockquote>
  </div>
</section>
```

- [ ] **Step 2: Restyle the shared shell**

Widen `.site-sheet` to `min(86rem, 100%)`, remove glass treatment, use one-pixel
rules, make `.site-header` a compact grid/control strip, use the mono family for
identity labels and nav, and make selected navigation red. Preserve 40px minimum
targets and collapse the shell cleanly below 44rem.

- [ ] **Step 3: Style the homepage as Field Archive**

Make `.site-cover` a two-column asymmetric grid, add a faint 32px grid to the
primary panel, render `.site-cover__mark` as an outlined blue target/crosshair,
and place the quote in the smaller secondary panel. Convert latest entries and
activity widgets to opaque archive panels with red row hover, blue secondary
marks, and no blur/glass/shadows.

- [ ] **Step 4: Run the source contract**

Run: `bash script/check_site.sh`

Expected: source assertions pass; generated checks either pass or reveal only
remaining component styling/build issues.

### Task 4: Unify Records, Media, And Article Components

**Files:**
- Modify: `_sass/basic.sass:215-435`
- Modify: `_sass/classes.sass:294-780`

- [ ] **Step 1: Restyle reusable records and controls**

Use `$font-family-mono` for dates, reading time, field labels, pagination, photo
numbers, buttons, and compact widget metadata. Keep titles in the sans stack and
article prose in serif. Replace translucent card backgrounds, blur, and inset
shadows with `$raised`, `$rule`, and sharp borders.

- [ ] **Step 2: Add restrained interactions**

Archive rows, album titles, photo cards, artist links, pagination, and back/read
controls get short color/border/transform transitions. Hover may turn a leading
rule red or reveal a `↗`/`→` pseudo-element where the destination is already
clear. Focus remains blue, and no content depends on hover.

- [ ] **Step 3: Preserve full-color media and readable articles**

Keep image filters unset, use neutral frames, constrain prose to roughly 70ch,
and give article headings generous vertical space. Use red for quote/progress
energy, blue for links and code details, and neutral syntax colors supplemented
only by the two brand accents.

- [ ] **Step 4: Verify responsive and RTL rules**

Ensure records stack without page-level overflow below 44rem, albums become a
single-column record below 36rem, photo cards become one column, and Persian
heading/body selectors retain Vazirmatn and correct right-side quote rules.

Run: `rg -n '\[dir="rtl"\]|@media \(max-width|prefers-reduced-motion' _sass/basic.sass _sass/classes.sass _sass/layout.sass`

Expected: RTL, mobile, and reduced-motion rules are present in their responsible partials.

### Task 5: Full Verification And Publication

**Files:**
- Modify if required: `script/check_site.sh`

- [ ] **Step 1: Run JavaScript unit checks**

Run: `node script/test_reader_context.js`

Expected: `Reader context tests passed.`

- [ ] **Step 2: Run direct Sass compilation**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index.css`

Expected: exit 0 with no Sass error.

- [ ] **Step 3: Run the production acceptance build**

Run: `bash script/check_site.sh`

Expected: Jekyll completes and prints `Site acceptance checks passed.`

- [ ] **Step 4: Inspect changed scope**

Run: `git status --short && git diff --check && git diff --stat`

Expected: only the planned design files plus the user's pre-existing `_etc`
changes are present; no whitespace errors.

- [ ] **Step 5: Commit implementation files only**

```bash
git add _includes/archive.html _layouts/page.html _sass/index.sass _sass/font.sass _sass/basic.sass _sass/layout.sass _sass/classes.sass script/check_site.sh docs/superpowers/plans/2026-06-30-technical-archive-redesign.md
git commit --no-gpg-sign -m "feat: redesign site as technical archive"
```

- [ ] **Step 6: Push the current branch**

Run: `git push origin master`

Expected: the remote `master` branch advances to the implementation commit and
GitHub Pages begins its normal build.
