# Notebook Label Blog Redesign

## Goal

Redesign the existing Jekyll site from its bright neobrutalist red/blue appearance into a dark, monochrome, print-inspired visual system. The result should evoke archival stationery, technical product packaging, and a notebook back cover without copying Rhodia branding, marks, or exact layouts.

The redesign must preserve all existing content, collection output, permalinks, canonical metadata, feed behavior, KaTeX support, comments integration, and GitHub Pages compatibility.

## Chosen Direction

Use the approved **Hybrid Specimen** direction:

- A dense, packaging-style homepage and navigation system.
- Catalog-like collection indexes and metadata.
- A quieter, comfortably narrow long-form reading area.
- Near-black textured paper, warm off-white ink, gray rules, and one restrained khaki accent.
- CSS-only decorative elements such as grid specimens, barcode rules, reference labels, and boxed legends.

## Site Structure

Keep the existing Jekyll architecture:

- `_layouts/default.html` remains the shared document shell.
- `_layouts/page.html`, `_layouts/post.html`, and `_layouts/photo.html` retain their current responsibilities.
- Existing collection includes continue to render code, essays, albums, and photos.
- `_config.yml` collections, permalinks, plugins, and feed settings remain unchanged.

Templates may gain semantic wrappers, labels, and metadata fields needed by the new visual system. No content files or URLs should be renamed.

## Global Shell

Render the site as a centered printed sheet on a near-black page:

- Maximum width approximately 72rem.
- Thin gray/off-white outer rules.
- Compact identity header with the site title and uppercase text navigation.
- Footer styled as a small production label with the description and external links.
- Subtle paper grain created with low-contrast CSS gradients or an inline data texture.
- Visible, high-contrast keyboard focus states.

Navigation must use text labels rather than icon-only controls so destinations remain immediately understandable. Existing Font Awesome assets may remain available for small supporting marks.

## Homepage

The homepage acts as the site cover:

- Large uppercase site title or editorial cover line.
- Small issue/specification label and the existing site description.
- Barcode-like divider and three small CSS grid diagrams.
- Compact collection legend for Code, Albums, Photos, and Et cetera.
- Latest posts presented as a catalog table with reference code, title, collection, and date.
- Existing Last.fm and Letterboxd embeds remain, restyled as bordered utility modules.

The homepage continues to aggregate the existing collections in reverse chronological order.

## Collection Indexes

Code and Et cetera indexes become catalog rows with:

- Sequential reference number.
- Date.
- Title.
- Optional excerpt or metadata when already available.

Album entries become specification records containing cover art, title, artist, year, publication date, and rating. Covers remain in color but receive restrained borders and reduced effects.

Photos become a dark contact-sheet grid. Each image receives a compact sequence number, title, and date. Remove marquee motion and bright duotone styling.

Pagination uses thin bordered cells with a clear current state and disabled state.

## Individual Content

Post headers contain:

- Uppercase title.
- Publication date.
- Collection/type label.
- Optional rating or other existing front matter.

Long-form content uses a narrower readable measure, approximately 68 characters, with a bundled serif face for body copy and bundled sans/mono faces for headings and utility labels.

Markdown styling must cover:

- `h1` through `h6`
- Paragraphs and links
- Ordered and unordered lists
- Blockquotes
- Inline code and highlighted code blocks
- Tables with responsive overflow
- Images, figures, and captions
- Horizontal rules
- Footnotes
- Audio and embedded content

Post images remain responsive. Album cover glow and hard-shadow effects are replaced with restrained borders and subtle tonal framing.

## Typography And Color

Use only bundled or system fonts:

- PT Serif for long-form body copy.
- PT Sans for headings and navigation.
- Departure Mono or a system monospace stack for labels, dates, code, and metadata.

Remove the Google Fonts import.

Proposed palette:

- Page black: `#090a09`
- Sheet charcoal: `#111210`
- Raised charcoal: `#171815`
- Warm ink: `#e7e4d9`
- Muted ink: `#aaa99f`
- Rule gray: `#5f6059`
- Restrained accent: `#b7b08c`

All combinations must maintain sufficient contrast for normal and small text.

## Responsive Behavior

At narrow widths:

- Reduce outer gutters and cover title size.
- Allow navigation to wrap into a compact grid.
- Collapse catalog tables into labeled rows without requiring horizontal page scrolling.
- Stack album information while keeping cover art reasonably sized.
- Use a single-column photo contact sheet.
- Preserve touch targets of at least roughly 2.5rem.

Wide code blocks and markdown tables may scroll within their own containers.

## Dependencies And Compatibility

Do not add JavaScript or external dependencies. Existing third-party embed scripts remain untouched.

Use the current Sass pipeline and Liquid features supported by Jekyll 4.2 and GitHub Pages-compatible builds. Keep front matter on Sass entry files.

## Verification

Run:

```bash
bundle exec jekyll build
```

Verify:

- Build completes without Liquid or Sass errors.
- Homepage, About, 404, Code, Et cetera, Albums, Photos, and representative posts render.
- Existing permalink paths are generated.
- `feed.xml` and canonical metadata remain present.
- No bright red/blue theme colors or Google Fonts requests remain in active styles.
- Navigation, focus states, catalog rows, markdown elements, and photo layouts work at desktop and mobile widths.
