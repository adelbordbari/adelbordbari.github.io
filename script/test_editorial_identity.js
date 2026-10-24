'use strict';

const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const compiledCssPath = process.env.EDITORIAL_CSS_PATH || join(root, '_site/assets/css/index.css');

assert.ok(existsSync(compiledCssPath), 'Build the site before checking its microdesign identity');

const css = readFileSync(compiledCssPath, 'utf8');

function ruleFor(selector) {
  const escapedSelector = selector
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  const matches = Array.from(css.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'g')));
  assert.ok(matches.length, `Compiled CSS is missing ${selector}`);
  return matches.map((match) => match[1]).join('\n');
}

function mediaBlocksFor(maxWidth) {
  const marker = `@media (max-width: ${maxWidth})`;
  const blocks = [];
  let searchFrom = 0;

  while (true) {
    const markerIndex = css.indexOf(marker, searchFrom);
    if (markerIndex === -1) return blocks;

    const openIndex = css.indexOf('{', markerIndex + marker.length);
    let depth = 1;
    let cursor = openIndex + 1;

    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }

    blocks.push(css.slice(openIndex + 1, cursor - 1));
    searchFrom = cursor;
  }
}

function lastMediaBlockFor(maxWidth) {
  const blocks = mediaBlocksFor(maxWidth);
  assert.ok(blocks.length, `Compiled CSS is missing the ${maxWidth} breakpoint`);
  return blocks.at(-1);
}

const html = ruleFor('html');
const body = ruleFor('body,\nbody.is-home');
const headings = ruleFor('h1, h2, h3, h4, h5, h6');
const sheet = ruleFor('.site-sheet');
const sheetTexture = ruleFor('.site-sheet::before');
const identityLabel = ruleFor('.site-identity__label,\n.utility-label');
const navLink = ruleFor('.site-nav a,\n.site-footer .site-nav a');
const navActive = ruleFor('.site-nav a:hover,\n.site-nav a.selected,\n.site-footer .site-nav a:hover,\n.site-footer .site-nav a.selected');
const cover = ruleFor('.site-cover');
const coverDither = ruleFor('.site-cover::after');
const coverTitle = ruleFor('.site-cover h1');
const catalogRow = ruleFor('.catalog-row');
const catalogHead = ruleFor('.catalog-row--head');
const utilityModule = ruleFor('.utility-module');
const comicCardImage = ruleFor('.comic-card__thumbnail img');
const albumCover = ruleFor('.album-cover-duotone');
const overflowingTitle = ruleFor('.collection-row__title--overflowing:hover,\n.collection-row__title--overflowing:focus-visible');
const pageHeader = ruleFor('.page-header,\n.post-header');
const articleProse = ruleFor('.post-content .prose');
const errorToken = ruleFor('.highlight .err');
const rtlQuote = ruleFor('.reading-region[dir="rtl"] blockquote');
const rtlReadingRegion = ruleFor('.reading-region[dir="rtl"]');
const persianReadingRegion = ruleFor('.reading-region[lang="fa"]');
const persianBlockquote = ruleFor('.reading-region[lang="fa"] blockquote');
const persianFigcaption = ruleFor('.reading-region[lang="fa"] figcaption');
const persianTable = ruleFor('.reading-region[lang="fa"] table');
const embeddedPersianReview = ruleFor('#letterboxd-embed-tc .letterboxd-embed-tc-review[lang="fa"]');
const lastfmArt = ruleFor('.recent-played-art');
const tabletStyles = lastMediaBlockFor('44rem');
const narrowStyles = lastMediaBlockFor('40rem');
const phoneStyles = lastMediaBlockFor('30rem');

assert.match(html, /--paper:\s*#f3f1e8/i);
assert.match(html, /--ink:\s*#171714/i);
assert.match(body, /background-color:\s*#f3f1e8/i);
assert.doesNotMatch(body, /linear-gradient|repeating-linear-gradient/i);
assert.match(headings, /font-family:\s*"Departure Mono"/i);
assert.match(headings, /text-transform:\s*uppercase/i);
assert.match(sheet, /border-radius:\s*0(?:;|\s)/i);
assert.match(sheet, /box-shadow:\s*none/i);
assert.match(sheet, /border:\s*2px solid #171714/i);
assert.match(sheetTexture, /background-image:\s*linear-gradient/i);
assert.match(identityLabel, /font-family:\s*"Departure Mono"/i);
assert.match(identityLabel, /letter-spacing:\s*0?\.12em/i);
assert.match(navLink, /border:\s*1px solid #171714/i);
assert.match(navLink, /font-family:\s*"Departure Mono"/i);
assert.match(navActive, /transform:\s*translate\(-1px, -1px\)/i);
assert.match(cover, /background:\s*#f3f1e8/i);
assert.match(cover, /border:\s*2px solid #171714/i);
assert.match(coverDither, /radial-gradient/i);
assert.match(coverDither, /background-size:\s*6px 6px/i);
assert.match(coverTitle, /font-family:\s*"Departure Mono"/i);
assert.match(catalogRow, /border-radius:\s*0(?:;|\s)/i);
assert.match(catalogRow, /border:\s*1px solid #171714/i);
assert.match(catalogHead, /background:\s*#171714/i);
assert.match(catalogHead, /color:\s*#f3f1e8/i);
assert.match(utilityModule, /border:\s*2px solid #171714/i);
assert.match(pageHeader, /border:\s*2px solid #171714/i);
assert.match(articleProse, /width:\s*100%/i);
assert.match(articleProse, /max-width:\s*74ch/i);
assert.match(errorToken, /color:\s*#fff(?:fff)?/i);
assert.match(rtlQuote, /border-right:\s*1px solid #171714/i);
assert.match(rtlReadingRegion, /direction:\s*rtl/i);
assert.match(rtlReadingRegion, /text-align:\s*right/i);
assert.match(persianReadingRegion, /font-family:\s*"Vazirmatn"/i);
assert.match(persianBlockquote, /font-family:\s*"Vazirmatn"/i);
assert.match(persianFigcaption, /font-family:\s*"Vazirmatn"/i);
assert.match(persianTable, /font-family:\s*"Vazirmatn"/i);
assert.match(embeddedPersianReview, /font-family:\s*"Vazirmatn"/i);
assert.match(lastfmArt, /width:\s*88px/i);
assert.match(lastfmArt, /height:\s*88px/i);
assert.match(lastfmArt, /flex:\s*0 0 88px/i);
assert.doesNotMatch(css, /\[dir=["']rtl["']\]\s+\.post-header/i);
assert.doesNotMatch(css, /folio-mark\.svg|content:\s*["']✦["']/i);
assert.doesNotMatch(css, /title-marquee/i);
assert.match(overflowingTitle, /overflow:\s*visible/i);
assert.match(overflowingTitle, /white-space:\s*normal/i);
assert.doesNotMatch(comicCardImage, /filter:/i);
assert.doesNotMatch(albumCover, /filter:/i);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
assert.match(tabletStyles, /\.site-cover h1\s*\{[^}]*font-size:\s*4\.4rem/i);
assert.match(narrowStyles, /\.page-header h1,[\s\S]*?\.post-header h1\s*\{[^}]*font-size:\s*2\.3rem/i);
assert.match(phoneStyles, /\.site-cover__primary\s*\{[^}]*padding:\s*1\.25rem 1rem 4\.5rem/i);
assert.doesNotMatch(narrowStyles, /\.collection-row \.reading-time\s*\{[^}]*display:\s*none/i);
assert.ok(css.lastIndexOf('@media (max-width: 44rem)') > css.lastIndexOf('font-size: 6.2rem;'));
assert.ok(css.lastIndexOf('@media (max-width: 40rem)') > css.lastIndexOf('font-size: 3.8rem;'));
assert.ok(css.lastIndexOf('@media (max-width: 30rem)') > css.lastIndexOf('padding-top: clamp(6rem, 14vw, 11rem);'));
assert.doesNotMatch(css, /#f02a3a|#ffb000|#1857ff|#00d48d|#e000a5/i);

console.log('Microdesign visual identity checks passed.');
