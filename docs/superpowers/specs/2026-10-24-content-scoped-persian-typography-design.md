# Content-scoped Persian Typography Design

## Intent

Persian typography and right-to-left flow should apply only to Persian prose, never to the surrounding post-detail interface. Generated dates and metadata remain English, while every visible Persian passage uses the bundled Vazirmatn font. The homepage media widgets should preserve the same distinction and have more balanced image proportions.

## Goals

- Keep the site shell, post header, metadata, and generated relative dates English and left-to-right.
- Apply `lang="fa"`, `dir="rtl"`, right alignment, and Vazirmatn to the Markdown reading region of a Persian post.
- Render Persian Letterboxd review text in Vazirmatn without changing the film widget's English metadata.
- Increase the square Last.fm artwork from 56px to 88px so it has visual weight comparable to, but not identical with, the Letterboxd poster.

## Non-goals and anti-goals

- Do not translate generated interface copy into Persian.
- Do not make the entire HTML document, article container, header, or metadata row RTL.
- Do not replace the site's established Latin display, UI, or monospace fonts.
- Do not make Last.fm artwork poster-shaped or exactly match the Letterboxd poster height.

## Constraints

- Continue using the locally bundled Vazirmatn file.
- Preserve mixed Latin phrases inside Persian prose and keep code/preformatted content LTR in the code font.
- Keep the existing Jekyll/Liquid and dependency-free JavaScript architecture.

## Approaches

1. **Content-scoped language and direction (selected):** keep the document interface English/LTR and put Persian language/direction attributes on the reading region. Mark generated dates as English and tag Persian Letterboxd review elements after embed insertion. This creates a semantic boundary matching the authored content.
2. **Whole-document Persian with CSS overrides:** retain `lang="fa" dir="rtl"` on the document and force every interface component back to LTR. Rejected because inherited direction and locale are fragile and caused the current defects.
3. **Unicode-range font substitution:** swap fonts based on glyph ranges. Rejected because it does not solve direction or date localization and would affect unrelated interface text.

## Implementation shape

- Treat post front-matter `lang` as the reading region's language while the default layout continues to use the site's English language unless a page explicitly opts into document-wide language metadata.
- Put explicit English language metadata on generated relative-time elements and make the date enhancer use each element's language.
- Narrow RTL and Persian font selectors to the element that explicitly carries `dir="rtl"` or `lang="fa"`; remove broad ancestor selectors that restyle headers and containers.
- After Letterboxd markup is inserted, identify review elements containing Persian-script characters and annotate those review elements as Persian/RTL.
- Set Last.fm cover artwork to an 88px square with matching flex basis.

## Verification

- Unit tests cover per-element date localization and Persian Letterboxd annotation.
- Source/style tests assert that only the reading region receives the post language/direction and that Last.fm artwork is 88px square.
- A production Jekyll build confirms the Persian album detail has an English/LTR document and header, an explicit Persian/RTL reading region, English relative time, and compiled Vazirmatn styling.
