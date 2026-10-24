'use strict';

const assert = require('node:assert/strict');
const {
  annotatePersianElements,
  containsPersianScript
} = require('../assets/js/persian-content.js');

assert.equal(containsPersianScript('فهمیدم کریستین بیل نه'), true);
assert.equal(containsPersianScript('Christian Bale surprised me'), false);

function review(textContent) {
  const attributes = {};
  return {
    attributes,
    textContent,
    setAttribute: (name, value) => { attributes[name] = value; }
  };
}

const persianReview = review('از اون چیزی که فکر می‌کردم بهتر بود.');
const englishReview = review('Better than I remembered.');
const root = {
  querySelectorAll: (selector) => {
    assert.equal(selector, '.letterboxd-embed-tc-review');
    return [persianReview, englishReview];
  }
};

const annotated = annotatePersianElements(root, '.letterboxd-embed-tc-review');

assert.deepEqual(annotated, [persianReview]);
assert.deepEqual(persianReview.attributes, { lang: 'fa', dir: 'rtl' });
assert.deepEqual(englishReview.attributes, {});

console.log('Persian content unit checks passed.');
