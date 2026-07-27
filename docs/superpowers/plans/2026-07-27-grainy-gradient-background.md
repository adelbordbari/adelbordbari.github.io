# Grainy Gradient Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CSS-only grainy gradient background that imitates the supplied reference images using the site's own color palette.

**Architecture:** Keep the change inside global Sass and the existing acceptance script. `body` owns the broad color fields, while `body::before` and `body::after` provide generated grain and shadow texture.

**Tech Stack:** Jekyll 4.2, Sass, CSS gradients, existing shell acceptance checks.

## Global Constraints

- No background image assets.
- No new dependencies.
- Use existing Sass palette variables.
- Static background only.
- Preserve `.site-sheet` readability.

---

### Task 1: Acceptance Check

**Files:**
- Modify: `script/check_site.sh`

**Interfaces:**
- Consumes: compiled Sass source text in `_sass/basic.sass`
- Produces: shell checks that fail until CSS-only grain markers are present

- [ ] **Step 1: Write the failing acceptance checks**

```bash
grep -q 'repeating-radial-gradient' _sass/basic.sass
grep -q 'repeating-conic-gradient' _sass/basic.sass
grep -q 'mix-blend-mode: multiply' _sass/basic.sass
grep -q 'filter: contrast' _sass/basic.sass
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash script/check_site.sh`

Expected: FAIL before the Sass implementation because the new grain markers are missing.

- [ ] **Step 3: Commit**

```bash
git add script/check_site.sh
git commit -m "test: require generated grain background"
```

### Task 2: Sass Background

**Files:**
- Modify: `_sass/basic.sass`

**Interfaces:**
- Consumes: palette variables from `_sass/index.sass`
- Produces: global static CSS-only background layers

- [ ] **Step 1: Implement the generated background**

Replace the grid background on `body` and dot overlay on `body::before` with layered radial gradients and CSS-only grain.

- [ ] **Step 2: Run test to verify it passes**

Run: `bash script/check_site.sh`

Expected: PASS with generated Sass and built CSS containing the expected palette colors.

- [ ] **Step 3: Commit**

```bash
git add _sass/basic.sass script/check_site.sh
git commit -m "style: add grainy gradient background"
```
