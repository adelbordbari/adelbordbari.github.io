# Purposeful Site Refinement

## Goal

Refine the existing Jekyll site into a polished personal portfolio, notebook,
technical journal, and blog without redesigning its established dark editorial
identity.

Every visible element must serve navigation, hierarchy, context, expression, or
reading comfort. The site should feel deliberately occupied, but not decorated
for decoration's sake.

## Scope

This is a surgical refinement. Preserve:

- the current Jekyll architecture and collections;
- the dark-only palette and editorial/catalog character;
- the header, homepage structure, compact indexes, and article layouts;
- the manually maintained monthly homepage quote;
- compact Last.fm and Letterboxd activity modules;
- static-first behavior with JavaScript used only for enhancement.

Do not add a theme switcher, a new projects collection, a large dependency, or a
new design system. Do not broadly rewrite existing content.

## Visual System

Keep the current locally hosted PT Serif, PT Sans, and Vazirmatn families.
Improve their use rather than introducing new fonts:

- PT Serif remains the primary reading face.
- PT Sans remains the interface, metadata, and heading face.
- Vazirmatn is selected automatically for Persian content.
- Monospace remains limited to code presentation.

Adjust type scale, line height, content measure, spacing, and wrapping where
needed for long-form reading. Reduce uppercase or condensed presentation only
where it harms scanning or comprehension. Strengthen muted text and rule
contrast to meet accessible dark-theme readability.

Retain subtle texture and glass where they communicate grouping or depth.
Standardize those effects and provide an opaque fallback for unsupported
browsers. Remove only ornament that supplies no useful context, such as fake
issue numbering, artificial record references, or a purely decorative barcode.

Indexes remain information-dense. Articles remain spacious enough for sustained
reading. Small-screen records stack cleanly instead of reproducing compressed
desktop tables.

## Content And Navigation

Keep the current primary navigation and collection structure:

- Home is the cross-collection overview.
- Code contains both technical writing and selected project case studies.
- Albums, Photos, and Et cetera retain their existing purposes.
- About remains the personal profile and contact page.

The homepage keeps:

- a concise personal introduction;
- the monthly quote as its expressive focal point;
- the latest cross-collection entries;
- compact Last.fm and Letterboxd modules as secondary context.

Homepage and collection metadata should use meaningful dates, categories, and
counts rather than generated filing codes.

Code entries may optionally declare `kind: project`. Project entries may also
provide `status`, `stack`, and `source_url`. Templates render these fields only
when present. Existing Code entries continue to work unchanged.

## Accessibility And International Text

Use native semantic elements and headings before ARIA. Preserve the skip link
and visible focus treatment. Ensure navigation, cards, pagination, and widget
links have adequate keyboard focus, target size, labels, and contrast.

Images use context-appropriate alternative text. Decorative visuals are hidden
from assistive technology. Tables and table-like indexes retain understandable
reading order at every viewport.

Any marquee or nonessential transition must stop under
`prefers-reduced-motion: reduce`. No information may depend on motion, hover, or
JavaScript.

Occasional Persian publishing must require only front matter:

- `lang: fa` selects Persian typography and implies RTL unless overridden.
- `dir: rtl` explicitly selects RTL layout.
- the document and article expose the correct language and direction.
- spacing and alignment adapt without requiring a separate layout.
- code, URLs, and other intrinsically LTR fragments remain LTR.
- mixed inline text uses browser-native bidirectional handling where possible.

## SEO And Metadata

Configure the production `url` and repository `baseurl` correctly. Generate:

- unique titles and descriptions;
- canonical URLs;
- Atom feed discovery;
- Open Graph and Twitter card metadata;
- article publication dates and content type;
- favicon metadata;
- JSON-LD for the site/person and individual articles.

Descriptions prefer explicit page front matter, then a normalized excerpt, then
the site description. Social images are emitted only when a valid page image,
cover, or configured default exists.

Implementation should remain compatible with the repository's GitHub Pages
deployment. Prefer local Liquid includes; add a plugin only if it is supported
by that deployment and materially reduces complexity.

## Widget Resilience

The generated page must remain useful without JavaScript or third-party
responses. Each activity module has:

- a visible descriptive label;
- a useful profile link in its initial markup;
- a compact loading state when enhancement begins;
- a non-disruptive failure state;
- no layout collapse when remote content is unavailable.

External scripts must not block core content or navigation.

## Verification

Extend `script/check_site.sh` with focused source and generated-site checks for:

- canonical, description, social, feed, and structured metadata;
- homepage and collection semantics;
- optional project metadata;
- Persian language and direction behavior;
- reduced-motion handling;
- widget links and fallback content;
- responsive and accessible image markup;
- expected generated routes.

Run the full Jekyll build. Inspect representative generated pages for Home,
Code, a regular article, a project-style article fixture or example, Albums,
Photos, About, and RTL output. Use lightweight automated HTML validation or
accessibility tooling only when it fits the existing toolchain without adding a
large runtime dependency.

## Success Criteria

- The site is recognizably the same site, with no broad layout redesign.
- Long-form English content is comfortable to read on mobile and desktop.
- Occasional Persian content works through front matter alone.
- Core navigation and content work with JavaScript disabled.
- External widgets fail gracefully.
- Metadata provides accurate search and social previews.
- Keyboard, focus, contrast, motion, and semantic behavior are materially
  improved.
- Decorative elements that remain have a clear expressive or structural role.
- The Jekyll build and repository acceptance checks pass.
