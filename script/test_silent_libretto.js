'use strict';

const assert = require('node:assert/strict');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');
const libretto = require('../assets/js/silent-libretto.js');

const root = join(__dirname, '..');
const workPath = join(root, '_silent_libretto', 'the-last-performance.md');
const layoutPath = join(root, '_layouts', 'silent-libretto.html');
const audioPath = join(root, 'assets', 'audio', 'silent-libretto', 'the-last-performance.mp3');
const work = readFileSync(workPath, 'utf8');
const layout = readFileSync(layoutPath, 'utf8');
const script = readFileSync(join(root, 'assets', 'js', 'silent-libretto.js'), 'utf8');

const starts = [...work.matchAll(/^  - start: ([\d.]+)$/gm)].map((match) => Number(match[1]));
const ends = [...work.matchAll(/^    end: ([\d.]+)$/gm)].map((match) => Number(match[1]));
const texts = [...work.matchAll(/^    text: "(.+)"$/gm)].map((match) => match[1]);
const passages = starts.map((start, index) => ({ start, end: ends[index], text: texts[index] }));

assert.equal(passages.length, 17);
assert.deepEqual(starts, [0, 12, 23, 35, 47, 59, 72, 83, 95, 108, 119, 132, 146, 158, 173, 182, 190]);
assert.deepEqual(ends, [12, 23, 35, 47, 59, 72, 83, 95, 108, 119, 132, 146, 158, 173, 182, 190, 196.176]);
assert.equal(texts[0], 'The theatre is empty. A single lamp glows above the stage.');
assert.equal(texts[16], 'It offers him its hand. Together, they bow.');

assert.equal(libretto.formatTime(0), '0:00');
assert.equal(libretto.formatTime(59.99), '0:59');
assert.equal(libretto.formatTime(60), '1:00');
assert.equal(libretto.formatTime(196.176), '3:16');
assert.equal(libretto.clamp(-4, 0, 196.176), 0);
assert.equal(libretto.clamp(250, 0, 196.176), 196.176);

assert.equal(libretto.passageIndex(passages, 0), 0);
assert.equal(libretto.passageIndex(passages, 11.999), 0);
assert.equal(libretto.passageIndex(passages, 12), 1);
assert.equal(libretto.passageIndex(passages, 119), 10);
assert.equal(libretto.passageIndex(passages, 195), 16);
assert.equal(libretto.passageIndex(passages, 196.176), 16);
assert.equal(libretto.passageIndex(passages, 197), -1);

assert.match(layout, /preload="metadata"/);
assert.doesNotMatch(layout, /autoplay/);
assert.match(layout, /page\.passages \| jsonify/);
assert.match(layout, /data-libretto-progress/);
assert.match(layout, /data-libretto-transcript/);
assert.doesNotMatch(layout, /data:audio/);
assert.match(script, /audio\.currentTime/);
assert.match(script, /'seeked'/);
assert.match(script, /requestAnimationFrame/);
assert.match(script, /aria-current/);

assert.equal(existsSync(audioPath), true);
assert.ok(statSync(audioPath).size > 4_000_000);
assert.equal(readFileSync(audioPath).subarray(0, 3).toString(), 'ID3');

console.log('Silent Libretto checks passed.');
