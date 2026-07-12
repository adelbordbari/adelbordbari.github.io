# Hybrid Editorial Redesign

## Goal

Redesign the entire Jekyll site around the visual language of the supplied
reference posters while keeping the site recognizably usable as a personal
notebook, archive, and bilingual reading space.

The selected direction is **Hybrid Editorial**: a strong black technical frame,
white mono-forward typography, calibration-chart accents, and rigid spacing,
tempered by calmer long-form reading areas and restrained use of decorative
motifs.

## Architecture

Keep the existing Jekyll, Liquid, and Sass architecture. Reuse the current
layouts, includes, collections, routes, and widgets. Concentrate the redesign in
the existing Sass partials and make only targeted template edits where the new
visual system needs structural hooks or clearer labels.

Do not add new collections, client-side dependencies, synthetic metadata, dummy
copy, fake codes, or decorative text content. The redesign changes presentation,
not information architecture.

## Visual Direction

The site should feel closer to a technical identity sheet than a conventional
blog theme. It uses:

- a near-black page field and slightly differentiated dark panels;
- stark white primary type and grayer utility text;
- thin rules, corner registration marks, and boxed panel boundaries;
- dotted reticles, stepped scales, and compact calibration bars as recurring
  graphic elements;
- rigid spacing and measured vertical rhythm rather than soft card-like padding.

The result must feel committed and graphic, but not novelty-driven. Decorative
marks provide structure and atmosphere only where they help the composition.

## Color System

Use the palette language from the references directly:

- base black for the page field;
- bright white for primary text;
- a short grayscale ramp for secondary text, rules, and panel hierarchy;
- a compact accent set for calibration details, including yellow, green, cyan,
  blue, magenta, and red.

Accent colors are not used as broad brand washes. They appear in small, high
impact moments such as header bars, separators, active indicators, and selected
graphic motifs. The overall experience remains overwhelmingly black, white, and
gray.

Images, album art, and photography retain their original colors. Decorative
palette elements must never overpower content imagery.

## Typography

Latin typography becomes mono-forward across the interface and major display
moments. Departure Mono remains the core Latin voice for headings, navigation,
labels, metadata, tables, captions, code, and utility copy. Where a more
comfortable reading texture is needed for long English passages, the body may
keep a readable companion face, but the surrounding system should still feel
firmly technical.

Persian text uses locally hosted Vazirmatn throughout. Persian pages, excerpts,
and prose blocks should visibly belong to the same system while preserving
proper RTL rhythm, spacing, and readability.

Type behavior:

- headings are large, crisp, and mostly uppercase where appropriate;
- metadata and navigation read like instrument labels;
- prose avoids excessive tracking or forced uppercase;
- code and UI remain visually aligned with the broader system;
- bilingual content keeps natural direction and legibility.

## Site Shell And Navigation

The outer shell becomes more poster-like: a stronger bordered frame, more
visible edge spacing, and subtle corner registration details. The header should
read as a compact control strip rather than a soft editorial masthead.

Navigation becomes denser and more technical, with clearer state changes,
sharper borders, and more deliberate spacing. The site title should feel like a
designed plate, not a generic blog wordmark.

The footer becomes a restrained production strip using existing real content
rather than invented credits.

## Homepage

The homepage becomes the clearest expression of the redesign. It should feel
like an identity or calibration poster built from the existing real content.

Key behaviors:

- the hero becomes a strong graphic composition rather than a soft intro block;
- the site title, short introduction, and quote remain real and visible;
- calibration bars, reticles, scales, or dotted fields may frame the composition
  without replacing content;
- the latest entries remain the main functional destination;
- media widgets stay present but are integrated as technical modules rather than
  card-like side content.

Do not add fictional slogans, fake system output, or arbitrary specimen text.

## Collection Pages

Archive, code, album, photo, and other index-like pages should feel like catalog
panels from the same system. This means sharper tables, boxed lists, cleaner
column rhythm, clearer separation between metadata and titles, and a more
deliberate hierarchy between collection labels and content rows.

Collection pages should keep their current real metadata and links, but present
them with higher contrast and a more technical cadence. Responsive stacking must
still preserve readable order on small screens.

## Articles And Pages

Posts and standalone pages need the strongest balance between the reference
style and reading comfort.

Their header zones should adopt the graphic system fully: bold titling,
technical metadata, rules, registration details, and stronger framing. The
reading region below should calm down enough for sustained reading while still
belonging to the same visual world through typography, spacing, rules, links,
code blocks, tables, and captions.

This redesign should make articles feel designed, not overloaded. Decorative
motifs should cluster around structure and empty space rather than interrupting
paragraph flow.

## Photos And Media

Photo indexes should shift away from soft gallery cards toward indexed plates or
contact-sheet-inspired panels. Captions and numbering should feel technical and
precise. Single-photo pages should frame the image like a documented artifact
without reducing the image itself.

Album pages should preserve cover art prominence while placing the surrounding
text and specs inside the new technical system. External embeds and activity
widgets should inherit the palette and spacing without becoming fragile.

## Accessibility And International Text

Preserve and strengthen:

- semantic landmarks and heading order;
- the skip link;
- visible keyboard focus;
- sufficient text and UI contrast;
- correct `lang` and `dir` behavior for Persian content;
- reduced-motion behavior for decorative transitions;
- readable line length in long-form prose;
- mobile layouts without page-level horizontal overflow.

Decorative marks must stay out of the accessibility tree and never carry meaning
that is unavailable in text.

## Verification

Validate the redesign through the existing site checks and a production build.
Inspect representative pages for Home, a collection index, a regular English
post, a Persian page or post, album content, and photo content at desktop and
mobile widths.

Verification should focus on:

- visual consistency across page types;
- preserved content and routing behavior;
- readable English and Persian prose;
- stable widgets and embeds;
- absence of invented metadata or placeholder content;
- responsive layouts that keep the graphic language intact.

## Success Criteria

- The site clearly reflects the supplied reference images without copying their
  literal text content.
- The redesign is sitewide rather than homepage-only.
- Decorative elements feel intentional and restrained.
- Persian content uses Vazirmatn and remains comfortable to read.
- Existing content structure, links, widgets, and routes continue to work.
- The interface feels more committed, technical, and graphic than the current
  softened archive treatment.
