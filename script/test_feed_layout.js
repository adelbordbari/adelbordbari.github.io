'use strict';

const assert = require('node:assert/strict');
const { limitFeed } = require('../assets/js/feed-layout.js');

const ENTRY_SELECTOR = '.letterboxd-embed-tc-diary-entry';
const DIVIDER_SELECTOR = '.letterboxd-embed-tc-divider';

function fixture(entryCount) {
  const entries = Array.from({ length: entryCount }, (_, index) => ({
    id: `entry-${index + 1}`,
    selector: ENTRY_SELECTOR,
    removed: false,
    remove() {
      this.removed = true;
    },
  }));
  const dividers = Array.from({ length: entryCount }, (_, index) => ({
    id: `divider-${index + 1}`,
    selector: DIVIDER_SELECTOR,
    removed: false,
    remove() {
      this.removed = true;
    },
  }));
  const nodes = entries.flatMap((entry, index) => [entry, dividers[index]]);

  return {
    root: {
      querySelectorAll(selector) {
        return nodes.filter((node) => node.selector === selector && !node.removed);
      },
    },
    entries,
    dividers,
  };
}

function retainedIds(nodes) {
  return nodes.filter((node) => !node.removed).map((node) => node.id);
}

{
  const { root, entries, dividers } = fixture(5);
  assert.equal(limitFeed(root), 3);
  assert.deepEqual(retainedIds(entries), ['entry-1', 'entry-2', 'entry-3']);
  assert.deepEqual(retainedIds(dividers), ['divider-1', 'divider-2']);
}

{
  const { root, entries, dividers } = fixture(3);
  assert.equal(limitFeed(root), 3);
  assert.deepEqual(retainedIds(entries), ['entry-1', 'entry-2', 'entry-3']);
  assert.deepEqual(retainedIds(dividers), ['divider-1', 'divider-2']);
}

{
  const { root, entries, dividers } = fixture(2);
  assert.equal(limitFeed(root), 2);
  assert.deepEqual(retainedIds(entries), ['entry-1', 'entry-2']);
  assert.deepEqual(retainedIds(dividers), ['divider-1']);
}

console.log('Feed layout unit checks passed.');
