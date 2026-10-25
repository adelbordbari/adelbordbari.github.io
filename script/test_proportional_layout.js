'use strict';

const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = join(__dirname, '..');
const SITE = join(ROOT, '_site');
const requestedPages = new Set(
  (process.argv.find((argument) => argument.startsWith('--page=')) || '--page=home')
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

async function main() {
  const server = await startServer();
  const { port } = server.address();
  const { chrome, websocketUrl } = await startChrome();
  const cdp = await connect(websocketUrl);
  try {
    if (requestedPages.has('home')) await testHome(cdp, `http://127.0.0.1:${port}`);
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
