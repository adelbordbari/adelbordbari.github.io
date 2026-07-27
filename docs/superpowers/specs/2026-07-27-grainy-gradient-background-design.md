# Grainy Gradient Background Design

## Goal

Replace the site's current grid-like page background with a code-generated background that imitates the supplied references' minimal industrial label/poster aesthetic.

## Requirements

- Do not use background image assets.
- Do not add new dependencies.
- Use a black, off-white, gray, acid-orange, and electric-blue Sass palette inspired by the references.
- Keep the background static and accessible; do not introduce motion.
- Preserve content readability inside `.site-sheet`.
- Avoid expensive fixed background attachment, body pseudo-layers, blur filters, dense grain, and blend modes.
- Make the effect more visible on the homepage than on inner pages.

## Approach

Use cheap linear gradients on `body` for a technical grid and hard accent bars.
The homepage gets stronger `body.is-home` and `.is-home .site-cover` variants so the industrial pattern is visible on the main surface without full-screen fixed layers.

## Verification

Add acceptance checks to `script/check_site.sh` for the generated background markers and performance constraints, then run the site acceptance script.
