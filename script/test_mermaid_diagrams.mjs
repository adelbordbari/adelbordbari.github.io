import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initMermaidDiagrams } from '../assets/js/mermaid-diagrams.mjs';

class TestElement {
  constructor(tagName, ownerDocument = null) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.style = {};
    this.textContent = '';
    this.className = '';
    this.listeners = {};
  }

  get classList() {
    return {
      contains: (className) => this.classes().includes(className),
      add: (...classNames) => {
        const current = new Set(this.classes());
        classNames.forEach((className) => current.add(className));
        this.className = Array.from(current).join(' ');
      }
    };
  }

  classes() {
    return this.className.split(/\s+/).filter(Boolean);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  replaceWith(replacement) {
    const siblings = this.parentElement.children;
    const index = siblings.indexOf(this);
    siblings.splice(index, 1, replacement);
    replacement.parentElement = this.parentElement;
    this.parentElement = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  hasAttribute(name) {
    return Object.hasOwn(this.attributes, name);
  }

  closest(selector) {
    let element = this;

    while (element) {
      if (element.matches(selector)) return element;
      element = element.parentElement;
    }

    return null;
  }

  matches(selector) {
    if (selector === 'pre') return this.tagName === 'PRE';
    if (selector.startsWith('.')) return this.classes().includes(selector.slice(1));
    if (selector.includes('.')) {
      const [tagName, className] = selector.split('.');
      return this.tagName === tagName.toUpperCase() && this.classes().includes(className);
    }

    return this.tagName === selector.toUpperCase();
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map((part) => part.trim());
    const matches = [];

    const visit = (element) => {
      selectors.forEach((part) => {
        if (matchesSelector(element, part) && !matches.includes(element)) matches.push(element);
      });

      element.children.forEach(visit);
    };

    this.children.forEach(visit);
    return matches;
  }

  cloneNode(deep = false) {
    const clone = new TestElement(this.tagName);
    clone.className = this.className;
    clone.textContent = this.textContent;
    clone.attributes = { ...this.attributes };
    clone.style = { ...this.style };

    if (deep) {
      this.children.forEach((child) => clone.appendChild(child.cloneNode(true)));
    }

    return clone;
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }
}

class TestDocument extends TestElement {
  constructor() {
    super('#document');
    this.ownerDocument = this;
    this.defaultView = {
      innerWidth: 800,
      innerHeight: 600
    };
    this.documentElement = {
      clientWidth: 800,
      clientHeight: 600
    };
  }

  createElement(tagName) {
    return new TestElement(tagName, this);
  }
}

function matchesSelector(element, selector) {
  if (selector === 'pre > code.language-mermaid') {
    return element.matches('code.language-mermaid') && element.parentElement?.matches('pre');
  }

  if (selector.includes(' ')) {
    const [ancestorSelector, childSelector] = selector.split(/\s+/);
    return element.matches(childSelector) && Boolean(element.closest(ancestorSelector));
  }

  return element.matches(selector);
}

const document = new TestDocument();
const article = document.createElement('article');
const pre = document.createElement('pre');
const code = document.createElement('code');
code.className = 'language-mermaid';
code.textContent = 'sequenceDiagram\n  Browser->>Server: Request token';

pre.appendChild(code);
article.appendChild(pre);
document.appendChild(article);

let options;
let runQuery;
const mermaid = {
  initialize: (nextOptions) => {
    options = nextOptions;
  },
  run: ({ querySelector }) => {
    runQuery = querySelector;
    const diagram = document.querySelector('.mermaid');
    const svg = document.createElement('svg');
    const text = document.createElement('text');
    svg.setAttribute('viewBox', '0 0 1200 800');
    text.setAttribute('font-size', '18px');
    svg.appendChild(text);
    diagram.appendChild(svg);
    return Promise.resolve();
  }
};

await initMermaidDiagrams(document, mermaid);

assert.equal(runQuery, '.mermaid');
assert.equal(options.theme, 'base');
assert.equal(options.themeVariables.primaryTextColor, '#050505');
assert.equal(options.themeVariables.lineColor, '#15130f');
assert.equal(options.themeVariables.actorBkg, '#fffdf6');
assert.equal(options.themeVariables.actorBorder, '#2f2a22');
assert.match(options.themeCSS, /rect\.actor[\s\S]+fill: #fffdf6/);
assert.match(options.themeCSS, /text\.actor[\s\S]+fill: #15130f/);
assert.doesNotMatch(options.themeCSS, /\.actor,[\s\S]+fill: #050505/);

const zoom = document.querySelector('.mermaid-zoom');
assert.ok(zoom);
assert.equal(zoom.getAttribute('tabindex'), '0');
assert.equal(zoom.getAttribute('role'), 'img');
assert.equal(zoom.querySelector('.mermaid svg').getAttribute('viewBox'), '0 0 1200 800');
assert.equal(zoom.querySelector('.mermaid-zoom__lens').getAttribute('aria-hidden'), 'true');
assert.equal(zoom.querySelector('.mermaid-zoom__detail').getAttribute('aria-hidden'), 'true');
assert.equal(zoom.querySelector('.mermaid-zoom__detail svg').getAttribute('viewBox'), '0 0 1200 800');

const source = zoom.querySelector('.mermaid-zoom__source');
const sourceSvg = zoom.querySelector('.mermaid svg');
const detailSvg = zoom.querySelector('.mermaid-zoom__detail svg');
source.scrollWidth = 500;
source.scrollHeight = 300;
source.getBoundingClientRect = () => ({ left: 10, top: 20, width: 500, height: 300 });

source.listeners.pointermove({ clientX: 30, clientY: 40 });
assert.equal(detailSvg.getAttribute('viewBox'), '0 0 448 448');
source.listeners.pointermove({ clientX: 490, clientY: 40 });
assert.equal(detailSvg.getAttribute('viewBox'), '752 0 448 448');
source.listeners.pointermove({ clientX: 30, clientY: 300 });
assert.equal(detailSvg.getAttribute('viewBox'), '0 352 448 448');
source.listeners.pointermove({ clientX: 490, clientY: 300 });
assert.equal(detailSvg.getAttribute('viewBox'), '752 352 448 448');
assert.equal(zoom.style['--mermaid-detail-size'], '448px');
assert.equal(zoom.style['--mermaid-detail-left'], '18px');

sourceSvg.getBoundingClientRect = () => ({ left: 210, top: 70, width: 100, height: 200 });
source.listeners.pointermove({ clientX: 260, clientY: 116 });
assert.equal(detailSvg.getAttribute('viewBox'), '376 0 448 448');
source.listeners.pointermove({ clientX: 260, clientY: 224 });
assert.equal(detailSvg.getAttribute('viewBox'), '376 352 448 448');

detailSvg.querySelector('text').setAttribute('font-size', '36px');
source.listeners.pointermove({ clientX: 260, clientY: 116 });
assert.equal(detailSvg.getAttribute('viewBox'), '152 -48 896 896');
source.listeners.pointermove({ clientX: 260, clientY: 170 });
assert.equal(detailSvg.getAttribute('viewBox'), '152 -48 896 896');
source.listeners.pointermove({ clientX: 260, clientY: 224 });
assert.equal(detailSvg.getAttribute('viewBox'), '152 -48 896 896');
detailSvg.querySelector('text').setAttribute('font-size', '18px');

source.getBoundingClientRect = () => ({ left: 260, top: 270, width: 500, height: 300 });
sourceSvg.getBoundingClientRect = null;
source.listeners.pointermove({ clientX: 740, clientY: 550 });
assert.equal(detailSvg.getAttribute('viewBox'), '752 352 448 448');
assert.equal(zoom.style['--mermaid-detail-left'], '268px');
assert.equal(zoom.style['--mermaid-detail-top'], '136px');

const mermaidStyles = readFileSync(new URL('../_sass/basic.sass', import.meta.url), 'utf8');
assert.match(mermaidStyles, /\.mermaid-zoom__detail\s+position: fixed[\s\S]+top: var\(--mermaid-detail-top/);
assert.match(mermaidStyles, /\.mermaid-zoom__source\s+display: grid\s+place-items: center\s+position: relative[\s\S]+overflow: visible/);
assert.match(mermaidStyles, /\.mermaid-zoom__source \.mermaid svg\s+display: block\s+width: 100%\s+min-width: 0\s+max-width: 100%\s+max-height: none\s+height: auto[\s\S]+object-fit: contain/);
assert.doesNotMatch(mermaidStyles, /\.mermaid-zoom__detail svg[\s\S]+transform: scale\(var\(--mermaid-zoom-scale\)\)/);

console.log('Mermaid diagram unit checks passed.');
