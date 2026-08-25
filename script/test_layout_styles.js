'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const classes = readFileSync(join(root, '_sass/classes.sass'), 'utf8');
const basic = readFileSync(join(root, '_sass/basic.sass'), 'utf8');

function declarationsFor(source, selector) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === selector);
  assert.notEqual(start, -1, `Missing ${selector} block`);

  const declarations = {};

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.length > 0 && !line.startsWith(' ')) break;

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || !trimmed.includes(':')) continue;

    const separator = trimmed.indexOf(':');
    declarations[trimmed.slice(0, separator)] = trimmed.slice(separator + 1).trim();
  }

  return declarations;
}

const catalogTable = declarationsFor(classes, '.catalog-table');
const catalogRail = declarationsFor(classes, '.catalog-table::before');
const collectionList = declarationsFor(classes, '.collection-list');
const collectionRail = declarationsFor(classes, '.collection-list::before');

assert.equal(catalogTable.padding, collectionList.padding);
assert.equal(catalogRail.inset, collectionRail.inset);
assert.equal(catalogRail['z-index'], collectionRail['z-index']);
assert.equal(catalogRail.width, collectionRail.width);
assert.equal(catalogRail.background, collectionRail.background);

const pre = declarationsFor(basic, 'pre');
const preCode = declarationsFor(basic, 'pre code');

assert.equal(pre['overflow-x'], 'hidden');
assert.equal(pre['white-space'], 'pre-wrap');
assert.equal(pre['overflow-wrap'], 'anywhere');
assert.equal(pre['word-break'], 'break-word');
assert.equal(preCode['white-space'], 'inherit');
assert.equal(preCode['overflow-wrap'], 'inherit');
assert.equal(preCode['word-break'], 'inherit');

const mermaidSource = declarationsFor(basic, '.mermaid-zoom__source');
const mermaidSourceSvg = declarationsFor(basic, '.mermaid-zoom__source .mermaid svg');

assert.equal(mermaidSource.overflow, 'visible');
assert.equal(mermaidSourceSvg.width, '100%');
assert.equal(mermaidSourceSvg['max-width'], '100%');
assert.equal(mermaidSourceSvg.height, 'auto');
assert.equal(mermaidSourceSvg['max-height'], 'none');
assert.equal(mermaidSourceSvg['object-fit'], 'contain');

console.log('Layout style checks passed.');
