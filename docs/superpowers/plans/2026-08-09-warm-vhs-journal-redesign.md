# Warm VHS Journal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the site into a warm VHS-inspired personal journal with louder non-post surfaces and calmer readable post pages.

**Architecture:** Keep the existing Jekyll/Liquid/Sass structure. Concentrate the redesign in `_sass/index.sass`, `_sass/basic.sass`, `_sass/layout.sass`, `_sass/classes.sass`, and `_sass/font.sass`, with only small Liquid changes where page-specific classes or structure are needed.

**Tech Stack:** Jekyll, Liquid includes/layouts, Sass indented syntax, locally hosted fonts.

## Global Constraints

- Use a cream/off-white global base with confident black framing, warm horizontal bands, and selective terminal-like black modules.
- Homepage, list pages, about pages, and photo pages carry the strongest visual moves.
- Post pages remain readable and restrained.
- Persian text stays on Vazirmatn.
- RTL behavior applies to Persian content areas, not to the entire shell or navigation.
- Preserve existing routes, collections, content, widgets, and semantic landmarks.
- Avoid fake technical copy, placeholder content, goofy visuals, and inaccessible decorative meaning.

---

## File Structure

- `_sass/index.sass`: design tokens for colors, font stacks, radius, and shadows.
- `_sass/font.sass`: local font-face declarations and font loading.
- `_sass/basic.sass`: global body, type, prose, media, code, table, and post-reading styles.
- `_sass/layout.sass`: site shell, header, nav, footer, and responsive framing.
- `_sass/classes.sass`: homepage, catalog/list, about/page, album, photo, and utility module surfaces.
- `_includes/archive.html`: archive/list markup already supplies rows and metadata; update only if class hooks are missing.
- `_layouts/default.html`, `_layouts/post.html`, `_layouts/page.html`, `_layouts/photo.html`: update only if page classes are needed for scoped visual treatment.
- `script/check_site.sh`: acceptance checks for palette, font loading, typography constraints, and generated site behavior.

### Task 1: Token And Font System

**Files:**
- Modify: `_sass/index.sass`
- Modify: `_sass/font.sass`
- Modify: `script/check_site.sh`

**Interfaces:**
- Produces: `$paper`, `$sheet`, `$raised`, `$ink`, `$muted`, `$rule`, `$accent-*`, `$font-family-display`, `$font-family-ui`, `$font-family-mono`, `$font-family-serif`, `$font-family-fa`
- Consumes: existing Sass variables used by all partials

- [ ] **Step 1: Inspect current font declarations**

Run: `sed -n '1,220p' _sass/font.sass`

Expected: local PT Serif, PT Sans, Departure Mono, and Vazirmatn declarations are visible.

- [ ] **Step 2: Update warm VHS tokens**

Change `_sass/index.sass` so the palette uses cream, black, amber, orange, red, raspberry, purple, and signal green/cyan accents. Set display/UI/mono to a coherent mono stack led by local Departure Mono unless a new licensed font has been vendored.

- [ ] **Step 3: Update acceptance checks**

Change `script/check_site.sh` to assert the warm VHS palette, local Departure Mono declaration, warm background marker, and no viewport-scaled typography.

- [ ] **Step 4: Run Sass compilation check**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index-warm-vhs.css`

Expected: command exits 0 and writes compiled CSS.

### Task 2: Global Shell And Reading Surfaces

**Files:**
- Modify: `_sass/basic.sass`
- Modify: `_sass/layout.sass`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: global warm page background, black shell frame, warm nav/footer bands, calm `.reading-region` and `.prose` behavior

- [ ] **Step 1: Redesign global background and type**

Update `body`, headings, links, focus states, `hr`, media, blockquotes, code, tables, and `.reading-region` so the global site feels warm and graphic while long prose stays calm.

- [ ] **Step 2: Redesign shell and navigation**

Update `.site-sheet`, `.site-header`, `.site-nav`, `.site-footer`, and mobile media queries so the frame feels like a VHS product interface with warm bands and black control strips.

- [ ] **Step 3: Preserve RTL scope**

Ensure `html[dir="rtl"]` does not flip the full shell. Add prose-scoped rules for `[dir="rtl"] .reading-region`, `.post-content[dir="rtl"]`, and related text blocks only.

- [ ] **Step 4: Run Sass compilation check**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index-warm-vhs.css`

Expected: command exits 0.

### Task 3: Homepage, Lists, About, Album, And Photo Surfaces

**Files:**
- Modify: `_sass/classes.sass`
- Review: `_includes/archive.html`
- Review: `_layouts/photo.html`
- Review: `_includes/photo-index.html`
- Review: `_includes/album-index.html`

**Interfaces:**
- Consumes: site collections and existing archive/list classes
- Produces: warmer homepage/list/catalog modules, stronger about/page treatments, special photo presentation, readable album surfaces

- [ ] **Step 1: Inspect list and media markup**

Run: `sed -n '1,260p' _includes/archive.html`
Run: `sed -n '1,260p' _includes/photo-index.html`
Run: `sed -n '1,260p' _layouts/photo.html`
Run: `sed -n '1,260p' _includes/album-index.html`

Expected: available classes and page structures are known before CSS edits.

- [ ] **Step 2: Redesign homepage/list/catalog classes**

Update `.site-cover`, `.catalog-section`, `.catalog-table`, `.catalog-row`, `.utility-grid`, and related classes to use cream/black VHS composition, warm bands, dense mono metadata, and strong scanning rhythm.

- [ ] **Step 3: Redesign photo and album classes**

Update photo index/single-photo styles toward a polished gallery/contact-sheet treatment. Keep album covers prominent and avoid overpowering review text.

- [ ] **Step 4: Run Sass compilation check**

Run: `sed '1,3d' assets/css/index.sass | npx --yes sass --stdin --indented --load-path=_sass >/tmp/adel-index-warm-vhs.css`

Expected: command exits 0.

### Task 4: Site Verification

**Files:**
- Read: `script/check_site.sh`
- Build output only in generated site directories

**Interfaces:**
- Consumes: completed Sass/Liquid redesign
- Produces: evidence that the site builds and routes survive

- [ ] **Step 1: Run existing site check**

Run: `script/check_site.sh`

Expected: command exits 0.

- [ ] **Step 2: Run production build if needed**

Run: `bundle exec jekyll build`

Expected: command exits 0.

- [ ] **Step 3: Inspect representative pages**

Check generated or local pages for home, `/code/`, `/about/`, one English post, one Persian post, album pages, and photo pages. Confirm no horizontal overflow, readable prose, coherent fonts, and warm VHS styling on non-post surfaces.

## Self-Review

- Spec coverage: palette, typography, page scope, Persian handling, photo freedom, and verification are covered by Tasks 1-4.
- Placeholder scan: no TBD/TODO/fill-in placeholders remain.
- Type consistency: Sass token names match existing project variables.
