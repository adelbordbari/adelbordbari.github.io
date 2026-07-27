# Grainy Gradient Background Design

## Goal

Replace the site's current grid-like page background with a code-generated background that imitates the supplied references' soft, grainy, high-contrast gradient texture while using the site's existing palette.

## Requirements

- Do not use background image assets.
- Do not add new dependencies.
- Use the existing Sass palette from `_sass/index.sass`.
- Keep the background static and accessible; do not introduce motion.
- Preserve content readability inside `.site-sheet`.

## Approach

Use layered CSS gradients on `body`, `body::before`, and `body::after`.
The base layer provides large blurred color fields from `$paper`, `$sheet`, `$raised`, `$ink`, `$accent-red`, `$accent-green`, `$accent-cyan`, and `$accent-yellow`.
The pseudo-elements add CSS-only stippled grain and soft ink shadows with `repeating-radial-gradient`, `repeating-conic-gradient`, and blend modes.

## Verification

Add acceptance checks to `script/check_site.sh` for the generated background markers, then run the site acceptance script.
