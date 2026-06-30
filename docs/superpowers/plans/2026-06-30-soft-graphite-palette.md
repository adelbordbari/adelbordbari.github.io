# Soft Graphite Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the technical archive redesign's visual contrast and make its overall impression gray-led while preserving readable prose and the exact brand red and blue.

**Architecture:** Adjust the centralized neutral tokens in `_sass/index.sass`, then soften only the solid accent interaction states and decorative opacity in the existing layout/component partials. Protect the intended neutral values and continued brand tokens with source acceptance checks in `script/check_site.sh`.

**Tech Stack:** Jekyll, indented Sass, Bash acceptance checks

---

### Task 1: Lock The Soft Graphite Contract

**Files:**
- Modify: `script/check_site.sh:41-49`

- [ ] **Step 1: Add source assertions for the approved neutral palette**

```bash
grep -q '\$paper: #17191c' _sass/index.sass
grep -q '\$sheet: #1d2024' _sass/index.sass
grep -q '\$raised: #24282d' _sass/index.sass
grep -q '\$ink: #c9c8c2' _sass/index.sass
grep -q '\$muted: #92969b' _sass/index.sass
grep -q '\$rule: #3d4248' _sass/index.sass
grep -q '\$rule-strong: #555b62' _sass/index.sass
```

- [ ] **Step 2: Run the acceptance checks and observe the expected failure**

Run: `bash script/check_site.sh`

Expected: FAIL after the reader-context tests because `$paper` still uses the
previous near-black value.

### Task 2: Apply The Gray-Led Hierarchy

**Files:**
- Modify: `_sass/index.sass:14-20`
- Modify: `_sass/basic.sass:20-22`
- Modify: `_sass/classes.sass:18-72`

- [ ] **Step 1: Replace only the neutral tokens**

```sass
$paper: #17191c !default
$sheet: #1d2024 !default
$raised: #24282d !default
$ink: #c9c8c2 !default
$muted: #92969b !default
$rule: #3d4248 !default
$rule-strong: #555b62 !default
```

Keep `$accent-red: #e43b2f` and `$accent-blue: #3b44e2` unchanged.

- [ ] **Step 2: Soften ambient grids and the hero target**

Use rule alpha `.1` for the page grid, `.12` for the hero grid, `.42` for the
blue target border, and `.38` for its crosshair. These values keep the motif
visible without competing with content.

- [ ] **Step 3: Compile Sass**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-soft-graphite.css`

Expected: exit 0; only the repository's existing Sass `@import` deprecation warnings may appear.

### Task 3: Reduce Solid Accent Contrast

**Files:**
- Modify: `_sass/layout.sass:93-102`
- Modify: `_sass/classes.sass:183-190`
- Modify: `_sass/classes.sass:570-577`

- [ ] **Step 1: Convert navigation active/hover states to washes**

```sass
.site-nav a:hover,
.site-nav a.selected
  border-color: rgba($accent-red, .65)
  background: rgba($accent-red, .1)
  color: $ink
```

- [ ] **Step 2: Convert row and pagination fills to washes**

```sass
.catalog-kind:hover
  background: rgba($accent-red, .1)
  color: $ink

.pagination a:hover,
.pagination .is-current
  border-color: rgba($accent-red, .65)
  background: rgba($accent-red, .1)
  color: $ink
```

Keep red selection and reading progress solid because they are brief, functional
signals rather than persistent surfaces.

- [ ] **Step 3: Run the acceptance suite**

Run: `bash script/check_site.sh`

Expected: `Site acceptance checks passed.` The script may report that generated
site checks were skipped when Bundler is unavailable.

### Task 4: Verify, Commit, And Publish

**Files:**
- Modify: `_sass/index.sass`
- Modify: `_sass/basic.sass`
- Modify: `_sass/layout.sass`
- Modify: `_sass/classes.sass`
- Modify: `script/check_site.sh`
- Create: `docs/superpowers/plans/2026-06-30-soft-graphite-palette.md`

- [ ] **Step 1: Run final verification**

```bash
node script/test_reader_context.js
bash script/check_site.sh
git diff --check
```

Expected: both test commands pass and the diff check emits no output.

- [ ] **Step 2: Stage only palette-adjustment files**

```bash
git add _sass/index.sass _sass/basic.sass _sass/layout.sass _sass/classes.sass script/check_site.sh docs/superpowers/plans/2026-06-30-soft-graphite-palette.md
```

- [ ] **Step 3: Commit and push**

```bash
git commit --no-gpg-sign -m "style: soften technical archive contrast"
git push origin master
```

Expected: `master` advances on `origin`, leaving the user's unrelated `_etc`
files uncommitted.
