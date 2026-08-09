# Warm VHS Journal Redesign

## Goal

Redesign the personal Jekyll site around a warm 1980s VHS/product-ad visual
language while preserving the site's role as a notebook for rants, technical
writing, album reviews, and photography.

## Direction

Use a cream/off-white global base with confident black framing, warm horizontal
bands, and selective terminal-like black modules. The site should feel playful,
designed, and slightly strange, but always professional.

The homepage, list pages, about pages, and photo pages carry the strongest
visual moves. Post pages remain readable and restrained, with typography,
spacing, and small accents connecting them to the broader system.

## Palette

Use a warm 80s palette:

- cream and warm gray page surfaces;
- near-black ink and module backgrounds;
- amber, orange, red, raspberry, and muted purple accent bands;
- small cyan/green signal accents only when they add technical contrast.

Avoid making the site a single-hue beige theme. Warm bands and black modules
should create enough contrast and energy.

## Typography

Latin display, navigation, labels, metadata, lists, and photo/catalog surfaces
should feel close to the Inky Mono references: stylized, mono-forward, visibly
fun, and deliberate. Because no licensed Inky Mono file is available, use an
open/free local font if a suitable one can be added safely, otherwise build the
look from the existing locally hosted Departure Mono and CSS treatment.

Long Latin prose should remain comfortable. Persian text stays on Vazirmatn.
RTL behavior applies to Persian content areas such as post/article prose and
metadata, not to the entire site shell or navigation.

## Page Behavior

Homepage:

- make the strongest impression;
- use existing content, not fake technical copy;
- use warm VHS bands, black panels, large display type, and catalog-like lists;
- make latest entries and site sections easy to scan.

List and about pages:

- present archive rows as designed catalog/index surfaces;
- use dense mono labels, confident separators, and warmer accents;
- preserve existing routes and collection behavior.

Post pages:

- prioritize reading comfort;
- avoid loud backgrounds inside the prose region;
- keep line length, code blocks, images, tables, and Persian RTL readable.

Photo pages:

- allow a stronger gallery/contact-sheet/art-catalog treatment;
- use darker presentation and bolder image framing where appropriate;
- remain polished rather than goofy or corny.

## Accessibility

Preserve semantic landmarks, skip link behavior, visible focus states, adequate
contrast, mobile readability, and no horizontal overflow. Decorative marks must
not carry information unavailable in text.

## Verification

Run the existing site check script and a production build if available. Inspect
home, code/list, about, a normal English post, a Persian post, album pages, and
photo pages at desktop and mobile widths.
