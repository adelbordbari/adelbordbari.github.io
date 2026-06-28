'use strict';

const assert = require('node:assert/strict');
const {
  calculateProgress,
  enhanceDates,
  enhanceProgress,
  relativeDateValue,
  relativeDateText
} = require('../assets/js/reader-context.js');

const now = new Date('2026-06-28T12:00:00Z');
assert.deepEqual(relativeDateValue(new Date('2026-06-28T08:00:00Z'), now), { value: 0, unit: 'day' });
assert.deepEqual(relativeDateValue(new Date('2026-06-27T08:00:00Z'), now), { value: -1, unit: 'day' });
assert.deepEqual(
  relativeDateValue(new Date('2026-06-27T00:00:00Z'), new Date('2026-06-28T18:00:00Z')),
  { value: -1, unit: 'day' }
);
assert.deepEqual(relativeDateValue(new Date('2024-06-26T12:00:00Z'), now), { value: -2, unit: 'year' });
assert.equal(relativeDateText({ value: -2, unit: 'year' }, 'en'), '2 years ago');
assert.equal(calculateProgress(200, 800, 200, 1800), 0);
assert.equal(calculateProgress(700, 800, 200, 1800), 50);
assert.equal(calculateProgress(1200, 800, 200, 1800), 100);
assert.equal(calculateProgress(700, 800, 200, 1800) > calculateProgress(500, 800, 200, 1800), true);
assert.equal(calculateProgress(300, 800, 200, 1800) < calculateProgress(500, 800, 200, 1800), true);

const time = { dateTime: '2024-06-26T00:00:00Z', textContent: 'June 26, 2024' };
enhanceDates({
  documentElement: { lang: 'en' },
  querySelectorAll: () => [time]
}, now);
assert.equal(time.textContent, '2 years ago');

const fill = { style: {} };
const attributes = {};
const progress = {
  hidden: true,
  querySelector: () => fill,
  setAttribute: (name, value) => { attributes[name] = value; }
};
const region = { getBoundingClientRect: () => ({ top: -500, height: 1800 }) };
const listeners = {};
enhanceProgress({
  querySelector: (selector) => selector === '.reading-progress' ? progress : region
}, {
  innerHeight: 800,
  scrollY: 700,
  addEventListener: (name, callback) => { listeners[name] = callback; },
  requestAnimationFrame: (callback) => callback()
});
assert.equal(progress.hidden, false);
assert.equal(fill.style.transform, 'scaleX(0.5)');
assert.equal(attributes['aria-valuenow'], '50');
assert.equal(typeof listeners.scroll, 'function');
assert.equal(typeof listeners.resize, 'function');

console.log('Reader context unit checks passed.');
