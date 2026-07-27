# Grainy Gradient Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CSS-only industrial technical background that imitates the supplied reference images with a black/off-white/orange/blue palette.

**Architecture:** Keep the change inside global Sass, homepage cover Sass, and the existing acceptance script. `body` owns a cheap technical grid and accent bars, while `.is-home .site-cover` carries the stronger homepage treatment.

**Tech Stack:** Jekyll 4.2, Sass, CSS gradients, existing shell acceptance checks.

## Global Constraints

- No background image assets.
- No new dependencies.
- Use existing Sass palette variables.
- Static background only.
- Preserve `.site-sheet` readability.
- Avoid fixed background attachment and blur filters.
- Avoid fixed body pseudo-layers, dense grain, and blend modes.
- Make the homepage texture stronger than inner pages.

---

### Task 1: Acceptance Check

**Files:**
- Modify: `script/check_site.sh`

**Interfaces:**
- Consumes: compiled Sass source text in `_sass/basic.sass`
- Produces: shell checks that fail until CSS-only grain markers are present

- [ ] **Step 1: Write the failing acceptance checks**

```bash
grep -q 'industrial-grid' _sass/basic.sass
grep -q 'body.is-home' _sass/basic.sass
grep -q '\.is-home \.site-cover' _sass/classes.sass
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash script/check_site.sh`

Expected: FAIL before the Sass implementation because the lightweight background marker and homepage selectors are missing.

- [ ] **Step 3: Commit**

```bash
git add script/check_site.sh
git commit -m "test: require generated grain background"
```

### Task 2: Sass Background

**Files:**
- Modify: `_sass/basic.sass`
- Modify: `_sass/classes.sass`

**Interfaces:**
- Consumes: palette variables from `_sass/index.sass`
- Produces: global static CSS-only grid/accent layers and a stronger homepage cover treatment

- [ ] **Step 1: Implement the generated background**

Replace the body background with lightweight linear gradients. Add `body.is-home` and `.is-home .site-cover` variants for stronger homepage visibility. Do not use `background-attachment: fixed`, body pseudo-layers, blur filters, blend modes, or dense grain.

- [ ] **Step 2: Run test to verify it passes**

Run: `bash script/check_site.sh`

Expected: PASS with generated Sass, homepage selectors, and built CSS containing the expected palette colors.

- [ ] **Step 3: Commit**

```bash
git add _sass/basic.sass script/check_site.sh
git commit -m "style: add grainy gradient background"
```
