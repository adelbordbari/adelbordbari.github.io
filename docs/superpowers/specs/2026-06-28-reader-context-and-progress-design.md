# Reader Context and Progress

## Goal

Make post metadata quieter and more useful by replacing classification-heavy
labels with relative dates and reading time, then add unobtrusive reading
progress to text-based entries. Photo entries may optionally include a written
backstory and receive the same reading aids when they do.

## Scope

Preserve the existing Jekyll collections, layouts, dark editorial design, and
static-first behavior. The work covers Code, Album, Et cetera, and optional
Photo text. It does not introduce another collection, content type, dependency,
or publishing requirement.

Existing front matter such as `kind`, `status`, `stack`, and `source_url` may
remain for internal or future use, but templates must not expose classification
labels such as Kind, Class, Project, Article, Status, or Stack to readers.
Collection names—Code, Album, Photo, and Et cetera—remain the only public type
system. Album-specific facts such as artist and rating remain visible because
they describe the work rather than classify the post.

## Public Metadata

Each text post header presents a compact metadata line containing:

- a relative publication date;
- calculated reading time;
- artist and rating only when relevant to an Album entry.

The collection name remains above the title as the post's sole category.
Project/article distinctions and generic field labels are removed. Tags and
other project-specific fields are not rendered in the post header.

Text collection indexes retain date and title, then replace their current
Project/Article column with reading time. The cross-collection homepage keeps
its Collection column because collection identity is necessary in that mixed
list. Dates become relative everywhere a publication date is shown, including
the homepage, collection indexes, album indexes, photo cards, post headers, and
individual photo captions.

Relative date text uses useful calendar-sized units: `today`, `yesterday`,
`3 days ago`, `2 months ago`, or `2 years ago`. Each `<time>` retains a machine-
readable `datetime` value and exposes the exact formatted date through its
`title`. Before enhancement, or when JavaScript is unavailable, the exact date
remains visible.

## Reading Time

Jekyll calculates reading time from rendered post content after stripping HTML.
The estimate uses 200 words per minute, rounds upward, and never displays less
than `1 min read` for non-empty text. The estimate is emitted at build time, so
it remains available without JavaScript and does not shift into place after
page load.

Reading time appears in individual text post headers and in the third column of
Code and Et cetera collection indexes. Album entries show it in their
individual post headers; the existing album index remains focused on album
facts. Image-only photo entries do not display a reading estimate.

## Photo Backstories

A Photo collection Markdown file may include ordinary Markdown content after
its front matter. The photo layout renders non-empty content beneath the figure
as a comfortably measured prose backstory. No additional front-matter flag is
required.

When a photo has a non-empty backstory, its page displays reading time and the
sticky progress indicator. When it has no backstory, the page remains the
current image-focused presentation with neither reading aid. Photo cards do not
show reading time, keeping the contact sheet visually quiet.

## Relative Date Enhancement

A small deferred JavaScript module finds marked `<time>` elements, parses their
ISO `datetime`, and replaces visible exact dates with relative phrases using
the browser's current time. It chooses the largest sensible unit among years,
months, days, and today, with correct singular and plural phrasing through
`Intl.RelativeTimeFormat` when available. A compact English fallback provides
equivalent output when that API is missing.

Invalid or missing dates are left unchanged. This enhancement has no network
dependency and does not block content rendering.

## Reading Progress

Text-enabled layouts emit one progress element at the top of the viewport. Its
track is a subtle rule and its fill uses the site's existing accent color. The
line is thin, fixed, and full-viewport width so it remains discoverable without
competing with the article header or reducing the reading measure.

The script measures progress through the actual reading region: `.prose` for
standard posts and the backstory container for photos. Progress is clamped from
zero at the reading region's start to 100 percent when its end reaches the
viewport's readable endpoint. A `requestAnimationFrame` guard handles scroll
and resize updates efficiently. Because progress is derived directly from the
current scroll position, it decreases immediately when the reader scrolls up
and increases when they scroll down.

The element uses progressbar semantics with an accessible label and updated
`aria-valuenow`. It is hidden when JavaScript is unavailable. Reduced-motion
preferences remove decorative transition effects; the progress information
continues to update without animation.

## Components and Data Flow

- Liquid templates calculate reading time and emit semantic metadata.
- Existing indexes mark date elements for relative-date enhancement.
- The standard post layout and conditional photo backstory layout emit the
  progress element and identify their reading region.
- One focused JavaScript asset enhances relative dates and scroll progress.
- Existing Sass files style the compact metadata, photo prose, and progress
  line using established variables and responsive conventions.

There is no persistent state and no third-party request. Liquid provides the
complete baseline page; JavaScript enhances only time phrasing and progress.

## Verification

Extend the repository acceptance script before implementation so the new checks
fail against the current templates. Checks cover:

- no reader-facing Kind, Class, Project, Article, Status, or Stack labels;
- semantic relative-date hooks with exact-date fallbacks;
- build-time reading-time output for representative Code, Album, and Et cetera
  posts;
- no reading time or progress on an image-only photo;
- conditional photo backstory markup when sample text is present;
- one deferred enhancement script and one progress element on text posts;
- progress styling, reduced-motion behavior, and accessible semantics;
- a successful Jekyll build and expected generated routes.

The JavaScript calculation is factored into small functions that can be checked
independently with the available runtime. Manual generated-page inspection
confirms that a representative long post reaches zero and 100 percent at the
correct bounds and reverses when scroll position decreases.

## Success Criteria

- Readers see collection identity without project/article classification.
- Every visible publication date uses a current human-relative phrase after
  enhancement while preserving the exact date semantically and as fallback.
- Text posts show a stable, build-time reading estimate.
- The top-edge progress line accurately follows both downward and upward
  scrolling through the post's text.
- Photo entries accept optional Markdown backstories without a new flag.
- Image-only photos remain uncluttered.
- Core content and exact dates remain useful without JavaScript.
- Repository acceptance checks and the Jekyll build pass.
