(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.init(root.document, root);
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const DAY = 86400000;

  function signedRound(value) {
    return Math.sign(value) * Math.round(Math.abs(value));
  }

  function relativeDateValue(date, now) {
    const publishedDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = (publishedDay - currentDay) / DAY;
    const absoluteDays = Math.abs(days);
    if (absoluteDays < 1) return { value: 0, unit: 'day' };
    if (absoluteDays < 30) return { value: signedRound(days), unit: 'day' };
    if (absoluteDays < 365) return { value: signedRound(days / 30), unit: 'month' };
    return { value: signedRound(days / 365), unit: 'year' };
  }

  function relativeDateText(relative, locale) {
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      return new Intl.RelativeTimeFormat(locale || 'en', { numeric: 'auto' })
        .format(relative.value, relative.unit);
    }
    if (relative.value === 0) return 'today';
    const count = Math.abs(relative.value);
    const unit = relative.unit + (count === 1 ? '' : 's');
    return relative.value < 0 ? `${count} ${unit} ago` : `in ${count} ${unit}`;
  }

  function calculateProgress(scrollY, viewportHeight, regionTop, regionHeight) {
    const distance = Math.max(regionHeight - viewportHeight, 1);
    const progress = ((scrollY - regionTop) / distance) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  function marqueeDuration(distance) {
    return Math.max(1.25, Math.min(3.5, distance / 140));
  }

  function updateCollectionTitle(title) {
    const distance = Math.max(0, Math.ceil(title.scrollWidth - title.clientWidth));

    if (distance <= 1) {
      title.classList.remove('collection-row__title--overflowing');
      title.style.removeProperty('--title-scroll-distance');
      title.style.removeProperty('--title-scroll-duration');
      return;
    }

    title.classList.add('collection-row__title--overflowing');
    title.style.setProperty('--title-scroll-distance', `-${distance}px`);
    title.style.setProperty('--title-scroll-duration', `${marqueeDuration(distance)}s`);
  }

  function enhanceCollectionTitles(document, window) {
    const titles = Array.from(document.querySelectorAll('.collection-row__title'));
    if (!titles.length) return;
    let queued = false;

    function update() {
      titles.forEach(updateCollectionTitle);
      queued = false;
    }

    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('resize', requestUpdate);

    if (window.ResizeObserver) {
      const observer = new window.ResizeObserver(requestUpdate);
      titles.forEach(function (title) { observer.observe(title); });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestUpdate);
    }

    update();
  }

  function enhanceDates(document, now) {
    document.querySelectorAll('.relative-time[datetime]').forEach(function (time) {
      const date = new Date(time.dateTime);
      if (Number.isNaN(date.getTime())) return;
      const locale = document.documentElement.lang || 'en';
      time.textContent = relativeDateText(relativeDateValue(date, now), locale);
    });
  }

  function enhanceProgress(document, window) {
    const progress = document.querySelector('.reading-progress');
    const region = document.querySelector('.reading-region');
    if (!progress || !region) return;
    const fill = progress.querySelector('.reading-progress__fill');
    let queued = false;

    function update() {
      const rect = region.getBoundingClientRect();
      const regionTop = rect.top + window.scrollY;
      const value = calculateProgress(window.scrollY, window.innerHeight, regionTop, rect.height);
      fill.style.transform = `scaleX(${value / 100})`;
      progress.setAttribute('aria-valuenow', String(Math.round(value)));
      queued = false;
    }

    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    progress.hidden = false;
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function init(document, window) {
    enhanceDates(document, new Date());
    enhanceCollectionTitles(document, window);
    enhanceProgress(document, window);
  }

  return {
    calculateProgress,
    enhanceCollectionTitles,
    enhanceDates,
    enhanceProgress,
    init,
    marqueeDuration,
    relativeDateText,
    relativeDateValue,
    updateCollectionTitle
  };
}));
