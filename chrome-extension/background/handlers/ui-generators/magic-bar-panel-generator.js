/**
 * Magic Bar panel generator
 * Generates JavaScript code to display Magic Bar search results in a sidebar panel
 */

import { getMagicBarPanelStyles } from './panel-styles.js';

/**
 * Returns a lightweight markdown parser function as a string
 * This function converts markdown text to HTML for display in the panel
 * @returns {string} - JavaScript function code string
 */
function getMarkdownParserCode() {
  // Using regular string concatenation to avoid template literal escaping issues
  const code = [
    'function parseMarkdown(text) {',
    '  if (!text) return "";',
    '  let html = text;',
    '',
    '  // Escape HTML to prevent XSS',
    '  html = html.replace(/&/g, "&amp;")',
    '             .replace(/</g, "&lt;")',
    '             .replace(/>/g, "&gt;");',
    '',
    '  // Code blocks (must be processed before other elements)',
    '  html = html.replace(/```([\\s\\S]*?)```/g, function(match, code) {',
    '    return "<pre><code>" + code.trim() + "</code></pre>";',
    '  });',
    '',
    '  // Inline code',
    '  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");',
    '',
    '  // Headings (process from h6 to h1 to avoid matching issues)',
    '  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");',
    '  html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");',
    '  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");',
    '  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");',
    '  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");',
    '  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");',
    '',
    '  // Bold (both ** and __)',
    '  html = html.replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>");',
    '  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");',
    '',
    '  // Italic (both * and _)',
    '  html = html.replace(/\\*([^*]+)\\*/g, "<em>$1</em>");',
    '  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");',
    '',
    '  // Strikethrough',
    '  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");',
    '',
    '  // Blockquotes',
    '  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");',
    '',
    '  // Horizontal rule',
    '  html = html.replace(/^---$/gm, "<hr>");',
    '  html = html.replace(/^\\*\\*\\*$/gm, "<hr>");',
    '',
    '  // Links',
    '  html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, \'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>\');',
    '',
    '  // Unordered lists',
    '  html = html.replace(/^[*-] (.+)$/gm, "<li>$1</li>");',
    '  html = html.replace(/(<li>.*<\\/li>\\n?)+/g, "<ul>$&</ul>");',
    '',
    '  // Ordered lists',
    '  html = html.replace(/^\\d+\\. (.+)$/gm, "<li>$1</li>");',
    '',
    '  // Tables',
    '  html = html.replace(/^\\|(.+)\\|$/gm, function(match, content) {',
    '    var cells = content.split("|").map(function(c) { return c.trim(); });',
    '    var isHeader = content.includes("---");',
    '    if (isHeader) return "";',
    '    return "<tr>" + cells.map(function(c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";',
    '  });',
    '  html = html.replace(/(<tr>.*<\\/tr>\\n?)+/g, "<table>$&</table>");',
    '',
    '  // Paragraphs - wrap text blocks that are not already wrapped in block elements',
    '  var lines = html.split("\\n");',
    '  var blockElements = ["<h1", "<h2", "<h3", "<h4", "<h5", "<h6", "<ul", "<ol", "<li", "<pre", "<blockquote", "<hr", "<table", "<tr"];',
    '  html = lines.map(function(line) {',
    '    var trimmed = line.trim();',
    '    if (!trimmed) return "";',
    '    var isBlock = blockElements.some(function(tag) { return trimmed.startsWith(tag); });',
    '    if (isBlock) return line;',
    '    return "<p>" + line + "</p>";',
    '  }).filter(function(line) { return line; }).join("\\n");',
    '',
    '  // Clean up empty paragraphs and fix nested issues',
    '  html = html.replace(/<p><\\/p>/g, "");',
    '  html = html.replace(/<p>(<h[1-6]>)/g, "$1");',
    '  html = html.replace(/(<\\/h[1-6]>)<\\/p>/g, "$1");',
    '  html = html.replace(/<p>(<ul>)/g, "$1");',
    '  html = html.replace(/(<\\/ul>)<\\/p>/g, "$1");',
    '  html = html.replace(/<p>(<pre>)/g, "$1");',
    '  html = html.replace(/(<\\/pre>)<\\/p>/g, "$1");',
    '  html = html.replace(/<p>(<blockquote>)/g, "$1");',
    '  html = html.replace(/(<\\/blockquote>)<\\/p>/g, "$1");',
    '  html = html.replace(/<p>(<table>)/g, "$1");',
    '  html = html.replace(/(<\\/table>)<\\/p>/g, "$1");',
    '  html = html.replace(/<p>(<hr>)/g, "$1");',
    '  html = html.replace(/(<hr>)<\\/p>/g, "$1");',
    '',
    '  return html;',
    '}',
  ];
  return code.join('\n');
}

/**
 * Generates JavaScript code to display Magic Bar results in a sidebar panel
 * Supports both product results and information/research results
 * @param {Object} searchResult - Search result object from magicBarSearch
 * @param {string} searchQuery - The original search query
 * @returns {string} - JavaScript code string
 */
export function generateMagicBarDisplayCode(searchResult, searchQuery) {
  const isProductResult = searchResult.type === 'products';
  const results = searchResult.results || [];
  const sources = searchResult.sources || [];
  const summary = searchResult.summary || '';
  const keyPoints = searchResult.keyPoints || [];

  // For product results, sort by price availability
  let sortedProducts = [];
  if (isProductResult) {
    sortedProducts = [...results].sort((a, b) => {
      const aHasPrice = a.price && a.price.trim() !== '';
      const bHasPrice = b.price && b.price.trim() !== '';
      if (aHasPrice && !bHasPrice) return -1;
      if (!aHasPrice && bHasPrice) return 1;
      return 0;
    });
  }

  const productsWithPrice = sortedProducts.filter((p) => p.price && p.price.trim() !== '').length;
  const styles = getMagicBarPanelStyles();

  const markdownParserCode = getMarkdownParserCode();

  return `
(function() {
  ${markdownParserCode}

  const IS_PRODUCT_RESULT = ${isProductResult};
  const PRODUCTS = ${JSON.stringify(sortedProducts)};
  const SOURCES = ${JSON.stringify(sources)};
  const SUMMARY = ${JSON.stringify(summary)};
  const KEY_POINTS = ${JSON.stringify(keyPoints)};
  const SEARCH_QUERY = ${JSON.stringify(searchQuery)};
  const PRODUCTS_WITH_PRICE = ${productsWithPrice};

  // Remove existing panel if present
  const existingPanel = document.getElementById('bw-magic-bar-panel');
  if (existingPanel) existingPanel.remove();
  const existingToggle = document.getElementById('bw-magic-toggle');
  if (existingToggle) existingToggle.remove();

  // Parse summary markdown
  const parsedSummary = parseMarkdown(SUMMARY);

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'bw-magic-bar-panel';
  panel.innerHTML = \`
    <style>${styles}</style>
    <div class="mb-header">
      <div class="mb-header-top">
        <div class="mb-logo">
          <div class="mb-logo-icon">✨</div>
          <div>
            <h3 class="mb-title">Magic Bar</h3>
            <div class="mb-subtitle">AI-Powered Search</div>
          </div>
        </div>
        <button class="mb-close" id="mb-close">×</button>
      </div>
      <div class="mb-query">
        <div class="mb-query-label">Searched for</div>
        <div class="mb-query-text">\${SEARCH_QUERY}</div>
      </div>
      \${IS_PRODUCT_RESULT && PRODUCTS.length > 0 ? \`
        <div class="mb-stats">
          <span class="mb-stat">\${PRODUCTS.length} products found</span>
          \${PRODUCTS_WITH_PRICE > 0 ? \`<span class="mb-stat highlight">\${PRODUCTS_WITH_PRICE} with prices</span>\` : ''}
        </div>
      \` : ''}
    </div>
    <div class="mb-content">
      \${IS_PRODUCT_RESULT ? \`
        \${PRODUCTS.length > 0 ? PRODUCTS.map(p => {
          const src = (p.source || '').toLowerCase().replace(/[^a-z]/g, '');
          const knownSrc = ['amazon', 'lazada', 'shopee', 'aliexpress', 'ebay', 'walmart', 'target', 'bestbuy', 'etsy', 'temu'];
          const srcClass = knownSrc.find(s => src.includes(s)) || 'default';
          const hasPrice = p.price && p.price.trim();
          const hasUrl = p.url && p.url.startsWith('http');
          return \`
            <div class="mb-product \${hasPrice ? 'has-price' : ''}" \${hasUrl ? \`onclick="window.open('\${p.url}', '_blank')"\` : ''}>
              <div class="mb-product-inner">
                <div class="mb-product-top">
                  <span class="mb-product-source mb-src-\${srcClass}">\${p.source || 'Web'}</span>
                  \${hasUrl ? '<span class="mb-verified">✓ Verified</span>' : ''}
                </div>
                <div class="mb-product-title">\${p.title}</div>
                \${hasPrice ? \`<div class="mb-product-price">\${p.price}</div>\` : '<div class="mb-no-price">Price not available</div>'}
                \${p.description ? \`<div class="mb-product-desc">\${p.description}</div>\` : ''}
                \${hasUrl ? \`<a href="\${p.url}" target="_blank" class="mb-view-btn" onclick="event.stopPropagation()">View Product →</a>\` : ''}
              </div>
            </div>
          \`;
        }).join('') : \`
          <div class="mb-no-results">
            <div class="mb-no-results-icon">🔍</div>
            <div class="mb-no-results-text">No products found</div>
          </div>
        \`}
      \` : \`
        \${SUMMARY ? \`
          <div class="mb-summary">
            <div class="mb-summary-title">Answer</div>
            <div class="mb-summary-text">\${parsedSummary}</div>
          </div>
        \` : ''}
        \${KEY_POINTS.length > 0 ? \`
          <div class="mb-key-points">
            <div class="mb-key-points-title">Key Points</div>
            \${KEY_POINTS.map(point => \`
              <div class="mb-key-point">
                <div class="mb-key-point-bullet"></div>
                <div>\${parseMarkdown(point)}</div>
              </div>
            \`).join('')}
          </div>
        \` : ''}
        \${SOURCES.length > 0 ? \`
          <div class="mb-sources-title">Sources (\${SOURCES.length})</div>
          \${SOURCES.map(s => \`
            <div class="mb-source-card" \${s.url ? \`onclick="window.open('\${s.url}', '_blank')"\` : ''}>
              <div class="mb-source-title">\${s.title}</div>
              \${s.url ? \`<div class="mb-source-url">\${s.url}</div>\` : ''}
            </div>
          \`).join('')}
        \` : ''}
        \${!SUMMARY && SOURCES.length === 0 ? \`
          <div class="mb-no-results">
            <div class="mb-no-results-icon">🔍</div>
            <div class="mb-no-results-text">No results found</div>
          </div>
        \` : ''}
      \`}
    </div>
    <div class="mb-footer">
      <div class="mb-footer-text">Powered by <span>Magic Bar</span> with Google Search</div>
    </div>
  \`;

  document.body.appendChild(panel);

  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'mb-toggle';
  toggle.id = 'mb-magic-toggle';
  toggle.innerHTML = '◀';
  document.body.appendChild(toggle);

  // Event handlers
  document.getElementById('mb-close').onclick = function() {
    panel.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
    toggle.innerHTML = panel.classList.contains('collapsed') ? '▶' : '◀';
  };

  toggle.onclick = function() {
    panel.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
    toggle.innerHTML = panel.classList.contains('collapsed') ? '▶' : '◀';
  };

  console.log('[Browser Wand] Magic Bar panel rendered:', IS_PRODUCT_RESULT ? PRODUCTS.length + ' products' : 'information result');
})();`;
}
