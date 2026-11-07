'use strict';

const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = join(__dirname, '..');
const SITE = join(ROOT, '_site');
const requestedPages = new Set(
  (
    process.argv.find((argument) => argument.startsWith('--page=')) ||
    '--page=home,detail,albums,activity,persian-post'
  )
    .slice('--page='.length)
    .split(',')
);

const MIME_TYPES = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function almostEqual(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}±${tolerance}, received ${actual}`
  );
}

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local.test').pathname);
      const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
      const candidate = normalize(join(SITE, relative));
      if (!candidate.startsWith(`${SITE}/`)) throw new Error('Invalid path');
      const body = await readFile(candidate);
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': MIME_TYPES[extname(candidate)] || 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

async function startChrome() {
  const chrome = spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
    '--no-sandbox',
    '--remote-debugging-port=0',
    '--user-data-dir=/tmp/adel-proportional-layout-chrome',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const websocketUrl = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Chrome did not start: ${output}`)), 10000);
    chrome.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
    chrome.once('exit', (code) => reject(new Error(`Chrome exited early with ${code}: ${output}`)));
  });

  return { chrome, websocketUrl };
}

async function connect(websocketUrl) {
  const socket = new WebSocket(websocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  return { send, socket };
}

async function openPage(cdp, url, width, height) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  }, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await new Promise((resolve) => setTimeout(resolve, 750));

  return {
    async evaluate(expression) {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    },
    async close() {
      await cdp.send('Target.closeTarget', { targetId });
    },
  };
}

async function homeMeasurements(cdp, baseUrl, width) {
  const page = await openPage(cdp, `${baseUrl}/`, width, 1000);
  try {
    return await page.evaluate(`(() => {
      const rect = (selector) => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom };
      };
      const cover = rect('.site-cover');
      const primary = rect('.site-cover__primary');
      const catalog = rect('.catalog-section');
      const utility = rect('.utility-grid');
      const header = rect('.site-header');
      const rows = [...document.querySelectorAll('.catalog-row:not(.catalog-row--head)')];
      const titles = [...document.querySelectorAll('.catalog-row:not(.catalog-row--head) > a:nth-child(2)')];
      return {
        viewportWidth: innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        cover,
        primary,
        catalog,
        utility,
        header,
        rowHeights: rows.map((row) => row.getBoundingClientRect().height),
        titles: titles.map((title) => ({
          clipped: title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight,
          height: title.getBoundingClientRect().height,
          text: title.textContent.trim(),
          width: title.getBoundingClientRect().width,
          whiteSpace: getComputedStyle(title).whiteSpace,
        })),
      };
    })()`);
  } finally {
    await page.close();
  }
}

async function testHome(cdp, baseUrl) {
  const desktop = await homeMeasurements(cdp, baseUrl, 1440);
  assert.ok(desktop.cover.width <= 1280.5, `desktop cover rail is ${desktop.cover.width}px`);
  assert.ok(desktop.catalog.width <= 1120.5, `desktop catalog rail is ${desktop.catalog.width}px`);
  assert.ok(desktop.utility.width <= 1120.5, `desktop utility rail is ${desktop.utility.width}px`);
  almostEqual(desktop.catalog.x, desktop.utility.x, 1, 'catalog and utility left rails');
  almostEqual(desktop.primary.width / desktop.cover.width, 8 / 13, 0.015, 'desktop hero primary ratio');
  almostEqual(desktop.catalog.y - desktop.cover.bottom, 64, 2, 'cover-to-catalog gap');
  almostEqual(desktop.utility.y - desktop.catalog.bottom, 48, 2, 'catalog-to-utility gap');

  const mobile = await homeMeasurements(cdp, baseUrl, 390);
  assert.ok(mobile.header.height <= 176, `mobile header is ${mobile.header.height}px tall`);
  assert.equal(mobile.scrollWidth, mobile.clientWidth, 'homepage must not scroll horizontally');
  assert.ok(mobile.rowHeights.length > 0, 'homepage should contain catalog rows');
  for (const height of mobile.rowHeights) {
    assert.ok(
      height >= 88 && height <= 112,
      `mobile catalog rows are ${mobile.rowHeights.join(', ')}px tall; titles: ${JSON.stringify(mobile.titles)}`
    );
  }
  for (const title of mobile.titles) {
    assert.notEqual(title.whiteSpace, 'nowrap', 'mobile catalog title must wrap');
    assert.equal(title.clipped, false, 'mobile catalog title must not be clipped');
  }
}

async function testDetail(cdp, baseUrl) {
  const desktopPage = await openPage(
    cdp,
    `${baseUrl}/album/2026-04-15-88-radio-tehran/`,
    1440,
    1000
  );
  let desktop;
  try {
    desktop = await desktopPage.evaluate(`(() => {
      const measure = (selector) => {
        const element = document.querySelector(selector);
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          bottom: box.bottom,
          fontFamily: style.fontFamily,
          fontSize: parseFloat(style.fontSize),
          height: box.height,
          lineHeight: parseFloat(style.lineHeight),
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
          width: box.width,
          x: box.x,
          y: box.y,
        };
      };
      return {
        header: measure('.post-header'),
        cover: measure('.post-cover'),
        reading: measure('.reading-region'),
      };
    })()`);
  } finally {
    await desktopPage.close();
  }

  almostEqual(desktop.header.width, 760, 1, 'detail header rail');
  almostEqual(desktop.cover.width, 512, 1, 'album cover rail');
  almostEqual(desktop.reading.width, 640, 1, 'reading panel rail');
  almostEqual(
    desktop.reading.width - desktop.reading.paddingLeft - desktop.reading.paddingRight,
    552,
    1,
    'reading text measure'
  );
  almostEqual(desktop.reading.fontSize, 18, 0.1, 'Persian reading font size');
  almostEqual(desktop.reading.lineHeight, 33.3, 0.2, 'Persian reading line height');
  assert.match(desktop.reading.fontFamily, /Vazirmatn/, 'Persian reading font must remain Vazirmatn');
  almostEqual(desktop.cover.y - desktop.header.bottom, 64, 2, 'header-to-cover gap');
  almostEqual(desktop.reading.y - desktop.cover.bottom, 48, 2, 'cover-to-reading gap');

  const mobilePage = await openPage(
    cdp,
    `${baseUrl}/album/2026-04-15-88-radio-tehran/`,
    390,
    1000
  );
  try {
    const mobile = await mobilePage.evaluate(`({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })`);
    assert.equal(mobile.scrollWidth, mobile.clientWidth, 'detail page must not scroll horizontally');
  } finally {
    await mobilePage.close();
  }
}

async function testAlbums(cdp, baseUrl) {
  const desktopPage = await openPage(cdp, `${baseUrl}/album/`, 1440, 1000);
  try {
    const desktop = await desktopPage.evaluate(`(() => {
      const box = document.querySelector('.page-content').getBoundingClientRect();
      return { width: box.width };
    })()`);
    assert.ok(desktop.width <= 1120.5, `album collection rail is ${desktop.width}px`);
  } finally {
    await desktopPage.close();
  }

  const mobilePage = await openPage(cdp, `${baseUrl}/album/`, 390, 1000);
  let mobile;
  try {
    mobile = await mobilePage.evaluate(`(() => {
      const entry = document.querySelector('.album-item__entry');
      const title = document.querySelector('.album-item__body h3 a');
      const specs = document.querySelector('.album-item__specs');
      const entryStyle = getComputedStyle(entry);
      const specsStyle = getComputedStyle(specs);
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        entryColumns: entryStyle.gridTemplateColumns.split(' ').filter(Boolean),
        entryWidth: entry.getBoundingClientRect().width,
        coverWidth: document.querySelector('.album-item__cover').getBoundingClientRect().width,
        specsColumns: specsStyle.gridTemplateColumns.split(' ').filter(Boolean),
        titleClipped: title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight,
        titleWhiteSpace: getComputedStyle(title).whiteSpace,
      };
    })()`);
  } finally {
    await mobilePage.close();
  }

  assert.equal(mobile.scrollWidth, mobile.clientWidth, 'album index must not scroll horizontally');
  assert.equal(mobile.entryColumns.length, 2, 'mobile album card must retain cover/body columns');
  almostEqual(mobile.coverWidth, 112, 1, 'mobile album cover width');
  assert.equal(mobile.specsColumns.length, 2, 'mobile album metadata must use two columns');
  assert.notEqual(mobile.titleWhiteSpace, 'nowrap', 'mobile album title must wrap');
  assert.equal(mobile.titleClipped, false, 'mobile album title must remain complete');
}

async function testActivity(cdp, baseUrl) {
  const page = await openPage(cdp, `${baseUrl}/`, 1440, 1000);
  let activity;
  try {
    activity = await page.evaluate(`(() => {
      const wrapper = document.querySelector('#letterboxd-embed-wrapper-tc');
      wrapper.innerHTML = '<div id="letterboxd-embed-tc">' +
        Array.from({ length: 5 }, (_, index) =>
          '<div class="letterboxd-embed-tc-diary-entry">Film ' + index + '</div>' +
          '<div class="letterboxd-embed-tc-divider"></div>'
        ).join('') +
        '</div>';
      window.feedLayout.limitFeed(wrapper);

      const lastfm = document.querySelector('.atomic-widget--lastfm');
      lastfm.innerHTML =
        '<div class="recent-played">' +
        '<img class="recent-played-art" alt="" ' +
        'src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">' +
        '<span class="recent-played-track">Track by Artist</span>' +
        '</div>';

      const borderWidths = (element) => {
        const style = getComputedStyle(element);
        return {
          top: parseFloat(style.borderTopWidth),
          right: parseFloat(style.borderRightWidth),
          bottom: parseFloat(style.borderBottomWidth),
          left: parseFloat(style.borderLeftWidth),
        };
      };
      const art = document.querySelector('.recent-played-art').getBoundingClientRect();
      const modules = [...document.querySelectorAll('.utility-module')];
      return {
        art: { width: art.width, height: art.height },
        dividers: wrapper.querySelectorAll('.letterboxd-embed-tc-divider').length,
        entries: wrapper.querySelectorAll('.letterboxd-embed-tc-diary-entry').length,
        letterboxdBorders: borderWidths(wrapper),
        lastfmBorders: borderWidths(document.querySelector('.recent-played')),
        moduleBorders: modules.map(borderWidths),
      };
    })()`);
  } finally {
    await page.close();
  }

  assert.equal(activity.entries, 3, 'activity fixture must retain three film entries');
  assert.equal(activity.dividers, 2, 'activity fixture must retain two internal dividers');
  almostEqual(activity.art.width, 88, 0.1, 'Last.fm artwork width');
  almostEqual(activity.art.height, 88, 0.1, 'Last.fm artwork height');
  for (const borders of activity.moduleBorders) {
    assert.deepEqual(borders, { top: 2, right: 2, bottom: 2, left: 2 });
  }
  assert.deepEqual(
    activity.lastfmBorders,
    { top: 1, right: 0, bottom: 0, left: 0 },
    'Last.fm content should use only an internal top rule'
  );
  assert.deepEqual(
    activity.letterboxdBorders,
    { top: 1, right: 0, bottom: 0, left: 0 },
    'Letterboxd content should use only an internal top rule'
  );
}

async function testPersianPost(cdp, baseUrl) {
  const detailPage = await openPage(
    cdp,
    `${baseUrl}/etc/2026-11-07-rephrasing/`,
    1440,
    1000
  );
  let detail;
  try {
    detail = await detailPage.evaluate(`(() => {
      const title = document.querySelector('.post-header .page-title');
      const reading = document.querySelector('.reading-region');
      const titleStyle = getComputedStyle(title);
      const readingStyle = getComputedStyle(reading);
      return {
        documentLang: document.documentElement.lang,
        documentDir: document.documentElement.dir,
        titleLang: title.lang,
        titleDir: title.dir,
        titleDirection: titleStyle.direction,
        titleFont: titleStyle.fontFamily,
        readingLang: reading.lang,
        readingDir: reading.dir,
        readingDirection: readingStyle.direction,
        readingFont: readingStyle.fontFamily,
      };
    })()`);
  } finally {
    await detailPage.close();
  }

  assert.equal(detail.documentLang, 'en', 'Persian post must keep English document chrome');
  assert.equal(detail.documentDir, 'ltr', 'Persian post must keep LTR document chrome');
  assert.equal(detail.titleLang, 'fa', 'Persian detail title must declare its language');
  assert.equal(detail.titleDir, 'rtl', 'Persian detail title must declare RTL direction');
  assert.equal(detail.titleDirection, 'rtl', 'Persian detail title must render RTL');
  assert.match(detail.titleFont, /Vazirmatn/, 'Persian detail title must use Vazirmatn');
  assert.equal(detail.readingLang, 'fa', 'Persian prose must declare its language');
  assert.equal(detail.readingDir, 'rtl', 'Persian prose must declare RTL direction');
  assert.equal(detail.readingDirection, 'rtl', 'Persian prose must render RTL');
  assert.match(detail.readingFont, /Vazirmatn/, 'Persian prose must use Vazirmatn');

  for (const path of ['/', '/etc/']) {
    const indexPage = await openPage(cdp, `${baseUrl}${path}`, 1440, 1000);
    let title;
    try {
      title = await indexPage.evaluate(`(() => {
        const link = [...document.querySelectorAll('a')].find((candidate) =>
          candidate.textContent.includes('چارچوبی برای واژه‌گزینی')
        );
        if (!link) return null;
        const style = getComputedStyle(link);
        return {
          lang: link.lang,
          dir: link.dir,
          direction: style.direction,
          font: style.fontFamily,
        };
      })()`);
    } finally {
      await indexPage.close();
    }

    assert.ok(title, `${path} must include the Persian post title`);
    assert.equal(title.lang, 'fa', `${path} Persian title must declare its language`);
    assert.equal(title.dir, 'rtl', `${path} Persian title must declare RTL direction`);
    assert.equal(title.direction, 'rtl', `${path} Persian title must render RTL`);
    assert.match(title.font, /Vazirmatn/, `${path} Persian title must use Vazirmatn`);
  }
}

async function main() {
  const server = await startServer();
  const { port } = server.address();
  const { chrome, websocketUrl } = await startChrome();
  const cdp = await connect(websocketUrl);
  try {
    if (requestedPages.has('home')) await testHome(cdp, `http://127.0.0.1:${port}`);
    if (requestedPages.has('detail')) await testDetail(cdp, `http://127.0.0.1:${port}`);
    if (requestedPages.has('albums')) await testAlbums(cdp, `http://127.0.0.1:${port}`);
    if (requestedPages.has('activity')) await testActivity(cdp, `http://127.0.0.1:${port}`);
    if (requestedPages.has('persian-post')) await testPersianPost(cdp, `http://127.0.0.1:${port}`);
    console.log(`Proportional layout checks passed: ${[...requestedPages].join(', ')}.`);
  } finally {
    cdp.socket.close();
    chrome.kill('SIGTERM');
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
