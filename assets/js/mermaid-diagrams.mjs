const MERMAID_CODE_SELECTOR = 'pre > code.language-mermaid, code.language-mermaid';
const MERMAID_SELECTOR = '.mermaid';
const ZOOM_SCALE = 2.8;
const ZOOM_EDGE_REACH_X = 0.12;
const ZOOM_EDGE_REACH_Y = 0.27;
const ZOOM_DETAIL_MAX_SIZE = 448;
const ZOOM_DETAIL_GAP = 16;
const ZOOM_DETAIL_POINTER_OFFSET = 24;
const MERMAID_THEME = {
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    background: '#f7f2e8',
    mainBkg: '#fffaf0',
    primaryColor: '#fffdf6',
    primaryBorderColor: '#2f2a22',
    primaryTextColor: '#050505',
    secondaryColor: '#e7f1ff',
    secondaryBorderColor: '#1857ff',
    secondaryTextColor: '#050505',
    tertiaryColor: '#fff2bf',
    tertiaryBorderColor: '#9b6a00',
    tertiaryTextColor: '#050505',
    lineColor: '#15130f',
    textColor: '#050505',
    fontFamily: '"PT Sans", Arial, sans-serif',
    fontSize: '18px',
    noteBkgColor: '#fff2bf',
    noteTextColor: '#050505',
    noteBorderColor: '#9b6a00',
    actorBkg: '#fffdf6',
    actorBorder: '#2f2a22',
    actorTextColor: '#050505',
    activationBkgColor: '#e7f1ff',
    activationBorderColor: '#1857ff',
    sequenceNumberColor: '#f7f2e8',
    labelBoxBkgColor: '#fffaf0',
    labelBoxBorderColor: '#15130f',
    labelTextColor: '#050505',
    edgeLabelBackground: '#fffaf0'
  },
  sequence: {
    actorFontSize: 18,
    messageFontSize: 16,
    noteFontSize: 16,
    useMaxWidth: false
  },
  flowchart: {
    useMaxWidth: false
  },
  themeCSS: `
    rect.actor {
      fill: #fffdf6 !important;
      stroke: #2f2a22 !important;
      stroke-width: 1.5px !important;
    }

    text.actor, .messageText, .loopText, .labelText, .nodeLabel, .edgeLabel, .noteText {
      color: #15130f !important;
      fill: #15130f !important;
    }

    .messageLine0, .messageLine1, .flowchart-link, .actor-line {
      stroke: #2f2a22 !important;
      stroke-width: 1.5px !important;
    }

    .labelBox, .loopLine {
      fill: #fffdf6 !important;
      stroke: #6c6255 !important;
    }
  `
};

function replacementTarget(code) {
  const pre = code.closest('pre');
  if (!pre) return code;

  const highlight = pre.parentElement && pre.parentElement.classList.contains('highlight')
    ? pre.parentElement
    : pre;

  return highlight.parentElement && highlight.parentElement.classList.contains('highlighter-rouge')
    ? highlight.parentElement
    : highlight;
}

export function prepareMermaidDiagrams(document) {
  document.querySelectorAll(MERMAID_CODE_SELECTOR).forEach(function (code) {
    if (code.closest('.mermaid')) return;

    const diagram = document.createElement('div');
    diagram.className = 'mermaid';
    diagram.textContent = code.textContent;

    replacementTarget(code).replaceWith(diagram);
  });
}

function setStyleProperty(element, property, value) {
  if (!element.style) return;

  if (typeof element.style.setProperty === 'function') {
    element.style.setProperty(property, value);
    return;
  }

  element.style[property] = value;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function edgeZone(length, reach, minimum) {
  return Math.min(Math.max(length * reach, minimum), length / 2);
}

function edgeProgress(value, length, reach, minimum) {
  if (length <= 0) return 0.5;

  const zone = edgeZone(length, reach, minimum);
  if (value <= zone) return 0;
  if (value >= length - zone) return 1;

  return (value - zone) / (length - (zone * 2));
}

function formatNumber(value) {
  return Number.parseFloat(value.toFixed(2)).toString();
}

function parseViewBox(value) {
  if (!value) return null;

  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;

  return {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3]
  };
}

function viewBoxValue(viewBox) {
  return [
    viewBox.x,
    viewBox.y,
    viewBox.width,
    viewBox.height
  ].map(formatNumber).join(' ');
}

function fullViewBoxFor(svg) {
  return parseViewBox(svg.getAttribute('data-mermaid-full-view-box'))
    || parseViewBox(svg.getAttribute('viewBox'));
}

function updateDetailViewBox(zoom, x, y) {
  const detailSvg = zoom.querySelector('.mermaid-zoom__detail svg');
  if (!detailSvg) return;

  const full = fullViewBoxFor(detailSvg);
  if (!full || full.width <= 0 || full.height <= 0) return;

  const cropSize = Math.min(full.width, full.height, Math.max(full.width, full.height) / ZOOM_SCALE);
  const maxX = full.width - cropSize;
  const maxY = full.height - cropSize;
  const crop = {
    x: full.x + (maxX * x),
    y: full.y + (maxY * y),
    width: cropSize,
    height: cropSize
  };

  detailSvg.setAttribute('viewBox', viewBoxValue(crop));
}

function viewportFor(source) {
  const view = source.ownerDocument?.defaultView || globalThis;
  const documentElement = source.ownerDocument?.documentElement;

  return {
    width: view.innerWidth || documentElement?.clientWidth || 1024,
    height: view.innerHeight || documentElement?.clientHeight || 768
  };
}

function setDetailPosition(zoom, source, event) {
  const viewport = viewportFor(source);
  const availableWidth = Math.max(160, viewport.width - (ZOOM_DETAIL_GAP * 2));
  const availableHeight = Math.max(160, viewport.height - (ZOOM_DETAIL_GAP * 2));
  const size = Math.min(ZOOM_DETAIL_MAX_SIZE, availableWidth, availableHeight);
  const rect = typeof source.getBoundingClientRect === 'function'
    ? source.getBoundingClientRect()
    : { left: 0, top: 0, width: 0, height: 0 };
  const clientX = event && Number.isFinite(event.clientX)
    ? event.clientX
    : rect.left + (rect.width / 2);
  const clientY = event && Number.isFinite(event.clientY)
    ? event.clientY
    : rect.top + (rect.height / 2);
  let left = clientX + ZOOM_DETAIL_POINTER_OFFSET;

  if (left + size > viewport.width - ZOOM_DETAIL_GAP) {
    left = clientX - ZOOM_DETAIL_POINTER_OFFSET - size;
  }

  left = clamp(left, ZOOM_DETAIL_GAP, viewport.width - size - ZOOM_DETAIL_GAP);

  const top = clamp(
    clientY - (size / 2),
    ZOOM_DETAIL_GAP,
    viewport.height - size - ZOOM_DETAIL_GAP
  );

  setStyleProperty(zoom, '--mermaid-detail-size', `${formatNumber(size)}px`);
  setStyleProperty(zoom, '--mermaid-detail-left', `${formatNumber(left)}px`);
  setStyleProperty(zoom, '--mermaid-detail-top', `${formatNumber(top)}px`);
}

function zoomTargetRect(source) {
  const svg = source.querySelector('.mermaid svg');

  if (svg && typeof svg.getBoundingClientRect === 'function') {
    const rect = svg.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) return rect;
  }

  return typeof source.getBoundingClientRect === 'function'
    ? source.getBoundingClientRect()
    : { left: 0, top: 0, width: 0, height: 0 };
}

function setZoomPoint(zoom, source, event) {
  const sourceRect = typeof source.getBoundingClientRect === 'function'
    ? source.getBoundingClientRect()
    : { left: 0, top: 0, width: 0, height: 0 };
  const targetRect = zoomTargetRect(source);
  const lensX = event && Number.isFinite(event.clientX) && sourceRect.width > 0
    ? clamp(event.clientX - sourceRect.left, 0, sourceRect.width) / sourceRect.width
    : 0.5;
  const lensY = event && Number.isFinite(event.clientY) && sourceRect.height > 0
    ? clamp(event.clientY - sourceRect.top, 0, sourceRect.height) / sourceRect.height
    : 0.5;
  const targetX = event && Number.isFinite(event.clientX)
    ? clamp(event.clientX - targetRect.left, 0, targetRect.width)
    : targetRect.width / 2;
  const targetY = event && Number.isFinite(event.clientY)
    ? clamp(event.clientY - targetRect.top, 0, targetRect.height)
    : targetRect.height / 2;
  const x = event && Number.isFinite(event.clientX) && targetRect.width > 0
    ? edgeProgress(targetX, targetRect.width, ZOOM_EDGE_REACH_X, 24)
    : 0.5;
  const y = event && Number.isFinite(event.clientY) && targetRect.height > 0
    ? edgeProgress(targetY, targetRect.height, ZOOM_EDGE_REACH_Y, 48)
    : 0.5;

  setStyleProperty(zoom, '--mermaid-zoom-x', `${Math.round(lensX * 10000) / 100}%`);
  setStyleProperty(zoom, '--mermaid-zoom-y', `${Math.round(lensY * 10000) / 100}%`);
  updateDetailViewBox(zoom, x, y);
  setDetailPosition(zoom, source, event);
}

function cloneSvg(svg) {
  const clone = svg.cloneNode(true);
  const full = parseViewBox(svg.getAttribute('viewBox'));

  if (full) clone.setAttribute('data-mermaid-full-view-box', viewBoxValue(full));

  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('focusable', 'false');
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return clone;
}

function attachZoomEvents(zoom, source) {
  if (typeof source.addEventListener !== 'function') return;

  const show = (event) => {
    zoom.classList.add('is-zooming');
    setZoomPoint(zoom, source, event);
  };
  const hide = () => zoom.classList.remove('is-zooming');

  source.addEventListener('pointerenter', show);
  source.addEventListener('pointermove', (event) => setZoomPoint(zoom, source, event));
  source.addEventListener('pointerleave', hide);
  zoom.addEventListener('focus', show);
  zoom.addEventListener('blur', hide);
}

export function enhanceMermaidDiagrams(document) {
  document.querySelectorAll(MERMAID_SELECTOR).forEach(function (diagram) {
    if (diagram.closest('.mermaid-zoom')) return;

    const svg = diagram.querySelector('svg');
    if (!svg) return;

    const zoom = document.createElement('div');
    const source = document.createElement('div');
    const lens = document.createElement('span');
    const detail = document.createElement('div');
    const detailFrame = document.createElement('div');

    zoom.className = 'mermaid-zoom';
    zoom.setAttribute('tabindex', '0');
    zoom.setAttribute('role', 'img');
    zoom.setAttribute('aria-label', 'Zoomable Mermaid diagram');
    setStyleProperty(zoom, '--mermaid-zoom-scale', ZOOM_SCALE);
    setStyleProperty(zoom, '--mermaid-zoom-x', '50%');
    setStyleProperty(zoom, '--mermaid-zoom-y', '50%');

    source.className = 'mermaid-zoom__source';
    lens.className = 'mermaid-zoom__lens';
    lens.setAttribute('aria-hidden', 'true');
    detail.className = 'mermaid-zoom__detail';
    detail.setAttribute('aria-hidden', 'true');
    detailFrame.className = 'mermaid-zoom__detail-frame';

    diagram.classList.add('mermaid-zoom__diagram');
    detailFrame.appendChild(cloneSvg(svg));
    detail.appendChild(detailFrame);
    diagram.replaceWith(zoom);
    source.append(diagram, lens);
    zoom.append(source, detail);
    attachZoomEvents(zoom, source);
  });
}

export async function initMermaidDiagrams(document, mermaid) {
  prepareMermaidDiagrams(document);

  if (!document.querySelector(MERMAID_SELECTOR)) return;

  mermaid.initialize(MERMAID_THEME);

  await mermaid.run({ querySelector: MERMAID_SELECTOR });
  enhanceMermaidDiagrams(document);
}
