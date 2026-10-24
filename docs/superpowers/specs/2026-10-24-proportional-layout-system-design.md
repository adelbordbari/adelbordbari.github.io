# Proportional Layout System Design

## Intent

Turn the visual-audit findings into a coherent spatial system. The site should retain its stark technical/editorial identity, but its major masses, reading widths, mobile density, and nested borders should feel deliberately related rather than independently sized.

## Goals

- Establish stable alignment rails: a 1280px presentation rail, a 1120px collection rail, a 760px detail-header rail, and a 640px reading rail.
- Keep the 512px square album cover as the visual anchor and give long-form text about 552px of usable width.
- Use an 8px-derived spacing rhythm for the major 16/24/32/48/64px relationships.
- Shift the homepage cover to an 8:5 split, close to a 61.5/38.5 proportion.
- Reduce mobile navigation and list-row height while preserving readable tap targets and complete information.
- Make mobile album cards wrap titles and arrange their four metadata values as a 2x2 grid.
- Keep Last.fm artwork at 88px and cap Letterboxd at three diary entries, bringing the activity modules into a roughly 1:3 height relationship.
- Reserve heavy frames for sections and use internal rules for nested widget content.
- Preserve the current palette, typography identity, Persian scoping, and content.

## Non-goals and anti-goals

- No palette redesign, ornamental decoration, or generic “golden ratio everywhere” treatment.
- No content edits, feed-data changes, or changes to external service ownership.
- No reduction of Persian legibility or reintroduction of whole-page RTL layout.
- No horizontal scrolling at 390px or wider.
- No dependency added solely for layout behavior or testing.

## Constraints

- Continue using Jekyll, Liquid, indented Sass, and dependency-free browser JavaScript.
- Respect the existing 320px minimum document width.
- Retain 88x88 Last.fm artwork; proportional improvement comes from feed mass and framing.
- External Letterboxd markup may contain more than three entries and separators; trimming must leave exactly three entries and only the two separators between them.
- Generated CSS must remain compatible with the repository's GitHub Pages Sass build.

## Approaches considered

### Chosen: tiered editorial rails with discrete spacing

Give each content type a stable maximum width and center it on the same axis. Use an 8px spacing scale, an 8:5 hero split, and explicit mobile compositions. This preserves the existing identity while correcting the measured proportional problems with understandable constraints.

### Rejected: universal golden-ratio scaling

Applying 1.618 to every width, type size, and gap creates brittle values and does not account for reading measure, tap targets, or real content. The hero can borrow the 8:5 relationship, but the rest should follow typography and information density.

### Rejected: fully fluid clamp-based sizing

Fluid interpolation would smooth transitions but perpetuate the audit's inconsistent 28.8px and 60.8px gaps. Stable rails and breakpoint-specific compositions create clearer alignment and are easier to verify.

## Detailed design

### Homepage hierarchy

- The cover is centered and capped at 80rem (1280px).
- Catalog and utility regions are centered and capped at 70rem (1120px).
- The cover uses 8fr/5fr columns at desktop sizes.
- Cover-to-catalog spacing is 4rem (64px); catalog-to-utilities spacing is 3rem (48px).
- At phone width, the primary cover panel is 20rem high, the site navigation stays to two rows by using three columns, and catalog rows use a date/title first tier plus a collection second tier. Titles may wrap rather than being clipped.

### Detail hierarchy and reading

- Post headers are centered at 47.5rem (760px).
- Album art remains centered at 32rem (512px).
- Reading panels are centered at 40rem (640px) with 2.75rem horizontal padding on desktop, leaving 34.5rem (552px) for text.
- Persian prose is 1.125rem with 1.85 line height. At mobile widths the reading-panel padding becomes 1rem while the same type remains readable.
- Major detail gaps use 4rem between header and cover and 3rem between cover and reading; mobile header separation becomes 2rem.

### Collection cards

- Collection pages share the 70rem rail and do not add a second horizontal content inset inside the page prose wrapper.
- At phone width album cards keep a compact 7rem cover beside the body.
- Titles wrap naturally.
- Metadata becomes a 2x2 grid with internal one-pixel rules and no overflow.

### Activity modules

- The Last.fm cover remains 88x88, which is visually comparable in area to a 70x105 film poster.
- Letterboxd is trimmed after injection to the latest three diary entries. The helper removes excess entries and all trailing separators while preserving the two separators between retained entries.
- The utility module remains the primary 2px frame. Inner Last.fm and Letterboxd containers use a top rule instead of complete nested boxes.

## Verification

- Browser geometry checks run against a generated local site at 1440px and 390px viewports.
- Assertions cover rail widths, hero ratio, major gaps, mobile header and catalog density, detail rails, cover size, Persian computed type, album metadata columns, and absence of horizontal overflow.
- A dependency-free unit test covers Letterboxd feed trimming for over-limit, exact-limit, and short feeds.
- Existing site acceptance and compiled editorial identity checks remain green.

