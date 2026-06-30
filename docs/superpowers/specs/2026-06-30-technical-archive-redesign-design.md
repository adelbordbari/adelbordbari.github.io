# Technical Archive Redesign

## Goal

Restyle the existing Jekyll site as a dark, high-contrast technical archive
without changing its content model, URLs, widgets, or established red and blue
brand colors. The result should feel premium, precise, experimental, and
slightly playful while remaining a comfortable bilingual reading environment.

The selected visual direction is **Field Archive**: editorial reading comfort
inside an asymmetric industrial grid. Technical motifs provide structure rather
than fictional atmosphere.

## Architecture

Keep the existing dependency-light Jekyll and Liquid architecture. Reuse the
current layouts and includes, changing their markup only where a semantic hook
or meaningful label is needed. Centralize the visual system in the existing Sass
partials rather than adding a component framework or client-side dependency.

The redesign must not modify article content, collection behavior, URLs, remote
widget behavior, reading progress, relative dates, or search/social metadata.

## Color System

Use a soft graphite hierarchy rather than absolute black and white. The base
surface is `#17191c`, the site sheet is `#1d2024`, raised records are `#24282d`,
primary text is a muted `#c9c8c2`, secondary text is `#92969b`, and rules range
from `#3d4248` to `#555b62`. This keeps long-form text comfortably above WCAG
contrast requirements while matching the quieter gray reference more closely.

Preserve the established brand colors exactly:

- red `#e43b2f` is the primary action accent for active navigation, important
  labels, progress, arrows, calls to action, selection, and hover feedback;
- blue `#3b44e2` is the secondary system accent for links, focus outlines,
  occasional panel rules, and restrained technical marks.

Solid accent fills are reserved for selection and reading progress. Navigation,
row, card, and pagination states prefer accent-colored outlines, text, or low
alpha washes so the overall page remains gray-led. No other strong accent color
is introduced. Images and album artwork retain their original colors. Shadows
are absent except for subtle focus or inset separation. Texture uses faint
monochrome noise and grid lines.

## Typography

- English long-form prose uses locally hosted PT Serif.
- Persian text uses locally hosted Vazirmatn with correct RTL behavior and a
  relaxed line height.
- Headings use a tall PT Sans/Arial Narrow stack, with oversized editorial scale
  and careful wrapping.
- Departure Mono is loaded locally for navigation, metadata, labels, captions,
  buttons, pagination, and code-related interface text.
- Body copy never becomes monospaced.

Uppercase and tracking are reserved for short interface labels. Long titles and
reading text preserve natural casing where uppercase would hurt readability.

## Shell And Navigation

Retain one bordered site shell but widen it and make its grid more explicit. The
header is a compact control strip with the site identity on one side and sharp,
rectangular navigation targets on the other. The current page receives a red
active treatment; keyboard focus uses blue. On narrow screens, navigation stays
easy to tap and wraps into a clean grid.

The footer becomes a compact production/contact strip built from the existing
description and external links.

## Homepage

Use an asymmetric split hero: the oversized site name and concise introduction
occupy the primary field, while the existing quote sits in a bordered editorial
panel. A restrained grid, corner mark, or target-like circle may occupy unused
space, but it must be decorative and hidden from assistive technology.

Keep latest entries as the main functional section. Render them as archive
records with useful filing date, title, and collection data. The Last.fm and
Letterboxd areas remain secondary and become quieter outlined technical modules.
No fictional status, coordinates, version number, or system readout is shown.

## Collections And Records

Collection pages use oversized page headings, meaningful collection labels, and
real entry counts where readily available. Lists are structured through one-pixel
rules rather than floating cards. Dates, titles, reading time, artists, years,
ratings, and categories remain the visible metadata where they already exist.

Album and photo imagery remains full-color. Neutral frames and controlled spacing
let those assets coexist with the red and blue interface palette. Album records
may become more grid-like but retain their covers and all current links. Photo
grids remain responsive and prioritize the images.

## Articles

Article pages begin with a dramatic header zone containing the useful collection,
title, date, reading time, artist, and rating fields already supplied by the
templates. The actual reading region remains calm, centered, and limited to a
comfortable measure. Headings, blockquotes, code blocks, tables, footnotes,
images, audio, and inline links receive consistent archive styling.

Persian pages require only their existing `lang` or `dir` front matter. Code and
other intrinsically LTR fragments remain LTR inside RTL articles.

## Interaction And Decoration

Controls are rectangular with square or minimally rounded corners. Hover states
may invert foreground and background, reveal an arrow, or shift a border. Motion
is short and never required to understand or operate the interface.

Crosshairs, calibration marks, outlined circles, brackets, and grid overlays are
implemented with lightweight CSS pseudo-elements. They are used sparingly at
section boundaries or in otherwise empty hero space. Decorative elements do not
contain user-facing pseudo-data and do not enter the accessibility tree.

## Responsive And Accessible Behavior

Desktop layouts use asymmetry and multiple columns where the content supports it.
Tablet and mobile layouts collapse into a clear single-column reading order.
Archive records stack meaningful fields without horizontal page overflow, images
remain fluid, and controls keep adequate touch targets.

Preserve the skip link, semantic landmarks, visible focus styles, sufficient
contrast, correct document language/direction, and reduced-motion handling. No
information depends on color, hover, animation, JavaScript, or decorative marks.

## Verification

Extend the existing source/generated-site checks only where necessary to protect
new structural hooks and brand tokens. Run the JavaScript reader-context test,
the repository site check, Sass compilation if available, and a production
Jekyll build. Inspect generated Home, Code, Album, Photo, About, representative
English post, and RTL output at desktop and mobile widths where tooling permits.

## Success Criteria

- The approved Field Archive direction is recognizable across every major page.
- Brand red and blue are the only strong interface accents.
- Existing content, routes, widgets, metadata, and reader functionality remain
  intact.
- English and Persian articles remain comfortable to read.
- All reusable site elements share one coherent token and component system.
- Mobile layouts remain legible and free from page-level horizontal overflow.
- Repository checks and the Jekyll production build pass.
