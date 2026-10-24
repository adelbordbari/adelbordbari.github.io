# Content-scoped Persian Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict Persian direction and Vazirmatn typography to authored Persian content while keeping interface metadata English/LTR and balancing the homepage media artwork.

**Architecture:** The default document remains in the site's English locale, while the post layout derives content language and direction for the reading region only. Generated dates declare their own English locale, Letterboxd review elements are annotated after remote markup insertion, and CSS responds only to explicit language/direction attributes.

**Tech Stack:** Jekyll/Liquid, indented Sass, dependency-free browser JavaScript, Node `assert`, Bash acceptance checks

**Spec:** `docs/superpowers/specs/2026-10-24-content-scoped-persian-typography-design.md`

## Global Constraints

- Continue using `assets/fonts/Vazirmatn-Regular.woff2`; add no font or package dependency.
- Preserve mixed Latin text and keep code/preformatted content LTR in the code font.
- Do not translate generated interface text or make the page shell, post container, header, or metadata RTL.
- Last.fm artwork remains square and becomes exactly 88px by 88px.

## Review Focus

- A Persian post with English metadata must produce an English/LTR document and Persian/RTL reading region.
- Relative times inside a Persian content page must remain English because the time element owns its locale.
- A Letterboxd review containing Persian-script characters must receive `lang="fa"` and `dir="rtl"`; an English review must remain unchanged.
- Mixed Persian prose containing Latin phrases must inherit Vazirmatn without reversing code/preformatted blocks.
- The 88px Last.fm image must retain a fixed flex basis without stretching or becoming poster-shaped.

---

### Task 1: Scope post language and generated dates

**Files:**
- Modify: `_layouts/default.html`
- Modify: `_layouts/post.html`
- Modify: `_includes/relative-date.html`
- Modify: `assets/js/reader-context.js`
- Modify: `script/test_reader_context.js`
- Modify: `script/check_site.sh`

**Interfaces:**
- Consumes: post front-matter `lang` and optional `dir`.
- Produces: `page_language`/`page_direction` for document chrome, `content_language`/`content_direction` for `.reading-region`, and per-`time.lang` localization in `enhanceDates(document, now)`.

- [ ] **Step 1: Write failing date and generated-markup tests**

Add a reader-context assertion where `documentElement.lang` is `fa` but the time element's `lang` is `en`, expecting `2 years ago`. Change the Jekyll acceptance assertions for the Persian album page to require `<html lang="en" dir="ltr">`, an unqualified LTR post container, `.reading-region.prose` with `lang="fa" dir="rtl"`, and relative time with `lang="en" dir="ltr"`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node script/test_reader_context.js`

Expected: FAIL because `enhanceDates` still takes the document language.

- [ ] **Step 3: Implement the content/document boundary**

Make `_layouts/default.html` derive the document locale from `page.document_lang` / `page.document_dir` with site-English fallbacks. In `_layouts/post.html`, derive Persian/Arabic/Hebrew content direction and place language/direction only on `.reading-region`. Add `lang="en" dir="ltr"` to generated relative times, then prefer `time.lang` in `enhanceDates`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node script/test_reader_context.js`

Expected: `Reader context unit checks passed.`

- [ ] **Step 5: Commit**

```bash
git add _layouts/default.html _layouts/post.html _includes/relative-date.html assets/js/reader-context.js script/test_reader_context.js script/check_site.sh
git commit -m "fix: scope Persian locale to post prose"
```

### Task 2: Annotate embedded Persian film reviews

**Files:**
- Create: `assets/js/persian-content.js`
- Create: `script/test_persian_content.js`
- Modify: `_includes/letterboxd.html`
- Modify: `script/check_site.sh`

**Interfaces:**
- Consumes: an embed root supporting `querySelectorAll(selector)` and review elements with `textContent`, `setAttribute(name, value)`.
- Produces: `containsPersianScript(text): boolean` and `annotatePersianElements(root, selector): Element[]`, exposed as CommonJS exports and `window.persianContent`.

- [ ] **Step 1: Write the failing Persian annotation unit test**

Cover Persian-script detection, rejection of Latin-only copy, adding `lang="fa"` and `dir="rtl"` to Persian review fixtures, and leaving English fixtures unchanged.

- [ ] **Step 2: Run the test and verify RED**

Run: `node script/test_persian_content.js`

Expected: FAIL because `assets/js/persian-content.js` does not exist.

- [ ] **Step 3: Implement and integrate the annotation helper**

Create the small UMD helper, load it from `_includes/letterboxd.html`, and call `annotatePersianElements(wrapper, '.letterboxd-embed-tc-review')` immediately after inserting fetched markup.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node script/test_persian_content.js`

Expected: Persian content unit checks pass.

- [ ] **Step 5: Commit**

```bash
git add assets/js/persian-content.js script/test_persian_content.js _includes/letterboxd.html script/check_site.sh
git commit -m "fix: mark embedded Persian reviews"
```

### Task 3: Apply scoped Vazirmatn styles and rebalance Last.fm art

**Files:**
- Modify: `_sass/basic.sass`
- Modify: `_sass/classes.sass`
- Modify: `_sass/editorial.sass`
- Modify: `script/test_layout_styles.js`
- Modify: `script/test_editorial_identity.js`

**Interfaces:**
- Consumes: explicit `[lang="fa"]` / `[dir="rtl"]` attributes from Tasks 1 and 2.
- Produces: scoped Persian typography/direction rules and fixed `88px` Last.fm image dimensions/flex basis.

- [ ] **Step 1: Write failing source and compiled-style tests**

Assert `.reading-region[lang="fa"]` uses `$font-family-fa`, `.reading-region[dir="rtl"]` is RTL/right-aligned, `.letterboxd-embed-tc-review[lang="fa"]` uses `$font-family-fa`, broad `[dir="rtl"] .post-header` styling is absent, and `.recent-played-art` is `88px` square with `flex: 0 0 88px`.

- [ ] **Step 2: Run the focused style test and verify RED**

Run: `node script/test_layout_styles.js`

Expected: FAIL because the scoped selectors and 88px artwork dimensions are absent.

- [ ] **Step 3: Implement the minimal Sass changes**

Replace ancestor-wide post RTL/font rules with explicit reading-region rules, retain LTR code behavior inside RTL prose, add a Persian Letterboxd review rule, update the editorial RTL quote selector, and size `.recent-played-art` to 88px.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node script/test_layout_styles.js`

Expected: `Layout style checks passed.`

- [ ] **Step 5: Run the complete acceptance suite**

Run: `bash script/check_site.sh`

Expected: all Node checks, Jekyll build assertions, and compiled editorial identity checks pass with `Site acceptance checks passed.`

- [ ] **Step 6: Inspect the built Persian album markup and working tree**

Run: `rg -n 'html lang=|post-content|reading-region prose|relative-time' _site/album/88-radio-tehran/index.html && git diff --check && git status --short`

Expected: English/LTR document and post metadata, Persian/RTL reading region, English/LTR relative time, no whitespace errors, and only intended changes plus the pre-existing untracked `tmp.md`.

- [ ] **Step 7: Commit**

```bash
git add _sass/basic.sass _sass/classes.sass _sass/editorial.sass script/test_layout_styles.js script/test_editorial_identity.js
git commit -m "fix: render Persian content with Vazirmatn"
```
