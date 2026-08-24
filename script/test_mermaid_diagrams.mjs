import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initMermaidDiagrams } from '../assets/js/mermaid-diagrams.mjs';

class TestElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.style = {};
    this.textContent = '';
    this.className = '';
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
}

class TestDocument extends TestElement {
  constructor() {
    super('#document');
  }

  createElement(tagName) {
    return new TestElement(tagName);
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
    svg.setAttribute('viewBox', '0 0 1200 800');
    diagram.appendChild(svg);
    return Promise.resolve();
  }
};

await initMermaidDiagrams(document, mermaid);

assert.equal(runQuery, '.mermaid');
assert.equal(options.theme, 'base');
assert.equal(options.themeVariables.primaryTextColor, '#050505');
assert.equal(options.themeVariables.lineColor, '#15130f');
assert.equal(options.themeVariables.actorBorder, '#15130f');

const zoom = document.querySelector('.mermaid-zoom');
assert.ok(zoom);
assert.equal(zoom.getAttribute('tabindex'), '0');
assert.equal(zoom.getAttribute('role'), 'img');
assert.equal(zoom.querySelector('.mermaid svg').getAttribute('viewBox'), '0 0 1200 800');
assert.equal(zoom.querySelector('.mermaid-zoom__lens').getAttribute('aria-hidden'), 'true');
assert.equal(zoom.querySelector('.mermaid-zoom__detail').getAttribute('aria-hidden'), 'true');
assert.equal(zoom.querySelector('.mermaid-zoom__detail svg').getAttribute('viewBox'), '0 0 1200 800');

const mermaidStyles = readFileSync(new URL('../_sass/basic.sass', import.meta.url), 'utf8');
assert.match(mermaidStyles, /\.mermaid-zoom__source \.mermaid svg\s+display: block\s+width: 100%\s+min-width: 0\s+max-width: 100%/);
assert.match(mermaidStyles, /\.mermaid-zoom__detail svg[\s\S]+transform: scale\(var\(--mermaid-zoom-scale\)\)/);

console.log('Mermaid diagram unit checks passed.');
