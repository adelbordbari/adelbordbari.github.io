'use strict';

const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const compiledCssPath = process.env.EDITORIAL_CSS_PATH || join(root, '_site/assets/css/index.css');
const ornamentPath = join(root, 'assets/images/folio-mark.svg');

assert.ok(existsSync(compiledCssPath), 'Build the site before checking its visual identity');

const css = readFileSync(compiledCssPath, 'utf8');

function ruleFor(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
const cover = ruleFor('.site-cover');
const catalogRow = ruleFor('.catalog-row');
const articleProse = ruleFor('.post-content .prose');
const errorToken = ruleFor('.highlight .err');
const rtlQuote = ruleFor('[dir=rtl] .prose blockquote');
const tabletStyles = lastMediaBlockFor('44rem');
const narrowStyles = lastMediaBlockFor('40rem');
const phoneStyles = lastMediaBlockFor('30rem');

assert.match(html, /--paper:\s*#f3f1e8/i);
assert.match(html, /--ink:\s*#171714/i);
assert.match(body, /background-color:\s*#f3f1e8/i);
assert.doesNotMatch(body, /linear-gradient|repeating-linear-gradient/i);
assert.match(headings, /font-family:\s*"PT Serif"/i);
assert.match(sheet, /border-radius:\s*0(?:;|\s)/i);
assert.match(sheet, /box-shadow:\s*none/i);
assert.match(cover, /background:\s*#f3f1e8/i);
assert.match(catalogRow, /border-radius:\s*0(?:;|\s)/i);
assert.match(articleProse, /max-width:\s*min\(74ch,\s*100%\)/i);
assert.match(errorToken, /color:\s*#fff(?:fff)?/i);
assert.match(rtlQuote, /border-right:\s*1px solid #171714/i);
assert.match(css, /url\([^)]*\.\.\/images\/folio-mark\.svg[^)]*\)/i);
assert.match(tabletStyles, /\.site-cover h1\s*\{[^}]*font-size:\s*4\.4rem/i);
assert.match(narrowStyles, /\.page-header h1,[\s\S]*?\.post-header h1\s*\{[^}]*font-size:\s*2\.3rem/i);
assert.match(phoneStyles, /\.site-cover__primary\s*\{[^}]*padding:\s*1\.25rem 1rem 4\.5rem/i);
assert.ok(css.lastIndexOf('@media (max-width: 44rem)') > css.lastIndexOf('font-size: 6.2rem;'));
assert.ok(css.lastIndexOf('@media (max-width: 40rem)') > css.lastIndexOf('font-size: 3.8rem;'));
assert.ok(css.lastIndexOf('@media (max-width: 30rem)') > css.lastIndexOf('padding-top: clamp(6rem, 14vw, 11rem);'));
assert.doesNotMatch(css, /#f02a3a|#ffb000|#1857ff|#00d48d|#e000a5/i);
assert.ok(existsSync(ornamentPath), 'The compiled ornament reference must resolve to a local asset');

console.log('Editorial visual identity checks passed.');
