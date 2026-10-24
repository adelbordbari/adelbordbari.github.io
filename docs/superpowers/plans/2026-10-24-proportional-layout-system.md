# Proportional Layout System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the audited proportional layout system across the homepage, post detail, collection cards, and activity widgets.

**Architecture:** Keep the existing Jekyll markup and editorial Sass layer, adding stable centered rails and breakpoint compositions in `_sass/editorial.sass`. Add one small dependency-free feed-layout helper for trimming injected Letterboxd entries, then verify the real generated pages with a headless-browser geometry script.

**Tech Stack:** Jekyll/Liquid, indented Sass, browser JavaScript, Node.js assertion scripts, headless Chrome, Dockerized Jekyll build.

**Spec:** `docs/superpowers/specs/2026-10-24-proportional-layout-system-design.md`

## Global Constraints

- Preserve the current palette, typography identity, Persian content scoping, and all authored content.
- Use 1280px, 1120px, 760px, 640px, and 512px as the presentation, collection, detail-header, reading, and cover rails.
- Use major spacing values from 16/24/32/48/64px.
- Retain 88x88 Last.fm artwork and show at most three Letterboxd entries.
- Keep the document free of horizontal overflow at 390px and wider.
- Add no runtime or test dependency.

## Review Focus

- Very long homepage titles at 390px wrap inside the catalog row without causing horizontal overflow; covered by Task 1 browser assertions.
- Collection pages at 390px retain usable card width after removing the nested prose inset; covered by Task 2 browser assertions.
- Persian posts keep only their reading region RTL while rendering at the intended font size and width; covered by Task 2 browser assertions and existing acceptance checks.
- Letterboxd responses with fewer than three entries retain all entries and correct separators; covered by Task 3 unit tests.
- Letterboxd responses with more than three entries leave no trailing divider after the third entry; covered by Task 3 unit tests.

---

### Task 1: Homepage rails, hero ratio, and mobile density

**Files:**
- Create: `script/test_proportional_layout.js`
- Modify: `_sass/editorial.sass`

**Interfaces:**
- Produces: browser geometry assertions for generated pages, reused by Tasks 2 and 3.

- [ ] **Step 1: Write failing desktop and mobile homepage geometry tests**

Assert at 1440px that the cover is at most 1280px, catalog and utilities are at most 1120px and share a rail, the hero primary ratio is 8/13 within tolerance, and the two major vertical gaps are 64px and 48px within tolerance. Assert at 390px that the header is at most 176px, catalog rows are between 88px and 112px, long titles are not horizontally clipped, and document scroll width equals viewport width.

- [ ] **Step 2: Build and run the geometry test to verify RED**

Run the Dockerized Jekyll build, then `node script/test_proportional_layout.js --page home`.

Expected: FAIL on current rail, ratio, spacing, header, or row geometry.

- [ ] **Step 3: Implement homepage proportions in `_sass/editorial.sass`**

Add centered 80rem/70rem rails, 8fr/5fr hero columns, 4rem/3rem major gaps, and phone navigation/catalog compositions using the spec's values.

- [ ] **Step 4: Rebuild and verify GREEN**

Run the Dockerized Jekyll build, then `node script/test_proportional_layout.js --page home`.

Expected: PASS.

- [ ] **Step 5: Commit**

Commit the homepage Sass and geometry test.

### Task 2: Detail reading rail and mobile album cards

**Files:**
- Modify: `script/test_proportional_layout.js`
- Modify: `_sass/editorial.sass`

**Interfaces:**
- Consumes: generated-site browser harness from Task 1.
- Produces: stable detail and collection geometry at desktop and phone widths.

- [ ] **Step 1: Add failing detail and album-index geometry tests**

Assert the desktop header, cover, and reading rails are 760px, 512px, and 640px within tolerance; reading content width is approximately 552px; Persian computed font is 18px/33.3px; and detail gaps are 64px/48px. At 390px assert page width does not overflow, album titles wrap, album cards retain a two-column cover/body composition, and metadata resolves to two columns.

- [ ] **Step 2: Run the focused geometry tests to verify RED**

Run `node script/test_proportional_layout.js --page detail,albums`.

Expected: FAIL on current rails, Persian type size, or mobile card composition.

- [ ] **Step 3: Implement detail and collection proportions**

Add the 47.5rem header, 40rem reading rail, desktop/mobile padding, 1.125rem Persian typography, 70rem collection-page rail, and phone album-card/metadata grid rules.

- [ ] **Step 4: Rebuild and verify GREEN**

Run the Dockerized Jekyll build, then `node script/test_proportional_layout.js --page detail,albums`.

Expected: PASS.

- [ ] **Step 5: Commit**

Commit the detail and collection Sass plus expanded geometry checks.

### Task 3: Activity feed mass and enclosure hierarchy

**Files:**
- Create: `assets/js/feed-layout.js`
- Create: `script/test_feed_layout.js`
- Modify: `_includes/letterboxd.html`
- Modify: `_sass/editorial.sass`
- Modify: `script/check_site.sh`
- Modify: `script/test_proportional_layout.js`

**Interfaces:**
- Produces: `window.feedLayout.limitFeed(root, options)` returning the retained entry count.
- Consumes: Letterboxd diary-entry and divider selectors from the live embed markup.

- [ ] **Step 1: Write failing feed-layout unit tests**

Test five-entry, three-entry, and two-entry feeds. The five-entry case must retain three entries, two separators, and no trailing separator; exact and short feeds must remain structurally correct.

- [ ] **Step 2: Run the unit test to verify RED**

Run `node script/test_feed_layout.js`.

Expected: FAIL because `assets/js/feed-layout.js` does not exist.

- [ ] **Step 3: Implement and integrate the feed limiter**

Create the dependency-free helper, load it before the inline Letterboxd script, and invoke it immediately after setting `wrapper.innerHTML` and before image waiting/Persian annotation.

- [ ] **Step 4: Add and verify activity geometry/enclosure behavior**

Extend the browser test fixture to assert three visible film entries, two dividers, retained 88px Last.fm art, and top-rule inner enclosures within 2px utility-module frames. Adjust editorial Sass to replace inner boxes with internal rules.

- [ ] **Step 5: Run all tests and commit**

Run `bash script/check_site.sh`, the Dockerized generated-site checks, `node script/test_feed_layout.js`, `node script/test_proportional_layout.js`, and `node script/test_editorial_identity.js` against compiled CSS.

Expected: all PASS.

Commit the widget helper, integration, styles, and tests.

## Final verification

- Build the production site in Docker.
- Run all repository scripts and both new test scripts.
- Capture and inspect desktop/mobile screenshots of homepage, Persian album detail, and album index.
- Confirm `git diff --check` and clean branch status except the pre-existing untracked `tmp.md` in the main checkout.
- Obtain one fresh whole-branch review, fix Critical/Important findings with RED/GREEN coverage, merge to `master`, push, and verify the GitHub Pages build is `built` for the pushed commit.

