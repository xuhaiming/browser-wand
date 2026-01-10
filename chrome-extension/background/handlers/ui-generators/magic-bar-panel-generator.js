/**
 * Magic Bar panel generator
 * Generates JavaScript code to display Magic Bar search results in a sidebar panel
 */

import { getMagicBarPanelStyles } from './panel-styles.js';
import { getMarkdownParserCode } from './markdown-parser.js';

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
