(function(root, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.feedLayout = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const DEFAULT_ENTRY_SELECTOR = '.letterboxd-embed-tc-diary-entry';
  const DEFAULT_DIVIDER_SELECTOR = '.letterboxd-embed-tc-divider';

  function limitFeed(root, options) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;

    const settings = options || {};
    const requestedLimit = Number(settings.limit ?? 3);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(0, Math.floor(requestedLimit))
      : 3;
    const entrySelector = settings.entrySelector || DEFAULT_ENTRY_SELECTOR;
    const dividerSelector = settings.dividerSelector || DEFAULT_DIVIDER_SELECTOR;
    const entries = Array.from(root.querySelectorAll(entrySelector));
    const retainedCount = Math.min(entries.length, limit);

    entries.slice(retainedCount).forEach((entry) => entry.remove());

    const dividers = Array.from(root.querySelectorAll(dividerSelector));
    dividers.slice(Math.max(0, retainedCount - 1)).forEach((divider) => divider.remove());

    return retainedCount;
  }

  return { limitFeed };
});
