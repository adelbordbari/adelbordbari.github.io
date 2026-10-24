(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.persianContent = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const PERSIAN_SCRIPT = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;

  function containsPersianScript(text) {
    return PERSIAN_SCRIPT.test(String(text || ''));
  }

  function annotatePersianElements(root, selector) {
    const annotated = [];
    Array.from(root.querySelectorAll(selector)).forEach(function (element) {
      if (!containsPersianScript(element.textContent)) return;
      element.setAttribute('lang', 'fa');
      element.setAttribute('dir', 'rtl');
      annotated.push(element);
    });
    return annotated;
  }

  return { annotatePersianElements, containsPersianScript };
}));
