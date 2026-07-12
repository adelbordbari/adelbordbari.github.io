const MERMAID_CODE_SELECTOR = 'pre > code.language-mermaid, code.language-mermaid';

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

export function initMermaidDiagrams(document, mermaid) {
  prepareMermaidDiagrams(document);

  if (!document.querySelector('.mermaid')) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'dark'
  });

  mermaid.run({ querySelector: '.mermaid' });
}
