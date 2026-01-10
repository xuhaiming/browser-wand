/**
 * Panel styles for Magic Bar and Image Generator panels
 * Contains all CSS styles used by the sidebar panels
 */

/**
 * Base panel styles shared by Magic Bar and Image Generator
 * @param {Object} options - Style options
 * @param {number} options.width - Panel width in pixels
 * @param {string} options.accentGradient - Primary gradient color
 * @returns {string} - CSS styles string
 */
function getBasePanelStyles({ width = 440, accentGradient = '#667eea 0%, #764ba2 100%' }) {
  return `
      #bw-magic-bar-panel {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: ${width}px !important;
        height: 100vh !important;
        background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%) !important;
        color: #e8e8e8 !important;
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.6) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        transition: transform 0.3s ease !important;
      }
      #bw-magic-bar-panel * { box-sizing: border-box !important; }
      #bw-magic-bar-panel.collapsed { transform: translateX(100%) !important; }
      .mb-header {
        padding: 24px 20px 20px !important;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        flex-shrink: 0 !important;
      }
      .mb-header-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; }
      .mb-logo {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      .mb-logo-icon {
        width: 36px !important;
        height: 36px !important;
        background: linear-gradient(135deg, ${accentGradient}) !important;
        border-radius: 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 18px !important;
      }
      .mb-title {
        font-size: 20px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, ${accentGradient}) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        margin: 0 !important;
      }
      .mb-subtitle {
        font-size: 11px !important;
        color: rgba(255, 255, 255, 0.5) !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }
      .mb-close {
        background: rgba(255, 255, 255, 0.1) !important;
        border: none !important;
        color: #888 !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 20px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s !important;
      }
      .mb-close:hover { background: rgba(255, 255, 255, 0.2) !important; color: #fff !important; }
      .mb-query {
        margin-top: 16px !important;
        padding: 12px 16px !important;
        background: rgba(0, 0, 0, 0.3) !important;
        border-radius: 10px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      .mb-query-label { font-size: 10px !important; color: #888 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; margin-bottom: 4px !important; }
      .mb-query-text { font-size: 14px !important; color: #fff !important; font-weight: 500 !important; }
      .mb-stats {
        display: flex !important;
        gap: 10px !important;
        margin-top: 12px !important;
      }
      .mb-stat {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        font-size: 11px !important;
        padding: 6px 12px !important;
        border-radius: 20px !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }
      .mb-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 20px !important;
      }
      .mb-content::-webkit-scrollbar { width: 6px !important; }
      .mb-content::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05) !important; }
      .mb-content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2) !important; border-radius: 3px !important; }
      .mb-no-results { text-align: center !important; padding: 60px 20px !important; }
      .mb-no-results-icon { font-size: 56px !important; margin-bottom: 20px !important; }
      .mb-no-results-text { color: #888 !important; font-size: 14px !important; }
      .mb-footer {
        padding: 16px 20px !important;
        background: rgba(0, 0, 0, 0.3) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        text-align: center !important;
        flex-shrink: 0 !important;
      }
      .mb-footer-text { font-size: 11px !important; color: #666 !important; }
      .mb-footer-text span { background: linear-gradient(135deg, ${accentGradient}) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; font-weight: 600 !important; }
      .mb-toggle {
        position: fixed !important;
        top: 50% !important;
        right: ${width}px !important;
        transform: translateY(-50%) !important;
        width: 28px !important;
        height: 56px !important;
        background: linear-gradient(135deg, ${accentGradient}) !important;
        border: none !important;
        border-radius: 10px 0 0 10px !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: white !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4) !important;
        transition: right 0.3s ease !important;
      }
      .mb-toggle.collapsed { right: 0 !important; }
  `;
}

/**
 * Information result styles for Magic Bar
 * @returns {string} - CSS styles string
 */
function getInfoResultStyles() {
  return `
      .mb-stat.highlight { background: rgba(76, 175, 80, 0.2) !important; color: #4caf50 !important; }
      .mb-summary {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 16px !important;
        padding: 20px !important;
        margin-bottom: 20px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      .mb-summary-title {
        font-size: 13px !important;
        color: #667eea !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        margin-bottom: 12px !important;
        font-weight: 600 !important;
      }
      .mb-summary-text {
        font-size: 15px !important;
        line-height: 1.7 !important;
        color: #e8e8e8 !important;
      }
      /* Markdown styles for summary text */
      .mb-summary-text h1,
      .mb-summary-text h2,
      .mb-summary-text h3,
      .mb-summary-text h4,
      .mb-summary-text h5,
      .mb-summary-text h6 {
        color: #fff !important;
        margin: 16px 0 8px 0 !important;
        font-weight: 600 !important;
        line-height: 1.4 !important;
      }
      .mb-summary-text h1 { font-size: 20px !important; }
      .mb-summary-text h2 { font-size: 18px !important; }
      .mb-summary-text h3 { font-size: 16px !important; }
      .mb-summary-text h4 { font-size: 15px !important; }
      .mb-summary-text h5, .mb-summary-text h6 { font-size: 14px !important; }
      .mb-summary-text p {
        margin: 0 0 12px 0 !important;
      }
      .mb-summary-text p:last-child {
        margin-bottom: 0 !important;
      }
      .mb-summary-text strong, .mb-summary-text b {
        font-weight: 600 !important;
        color: #fff !important;
      }
      .mb-summary-text em, .mb-summary-text i {
        font-style: italic !important;
      }
      .mb-summary-text code {
        background: rgba(102, 126, 234, 0.2) !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace !important;
        font-size: 13px !important;
        color: #a5b4fc !important;
      }
      .mb-summary-text pre {
        background: rgba(0, 0, 0, 0.4) !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        overflow-x: auto !important;
        margin: 12px 0 !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      .mb-summary-text pre code {
        background: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        font-size: 12px !important;
        line-height: 1.5 !important;
        color: #e8e8e8 !important;
      }
      .mb-summary-text ul, .mb-summary-text ol {
        margin: 12px 0 !important;
        padding-left: 24px !important;
      }
      .mb-summary-text li {
        margin: 6px 0 !important;
        line-height: 1.6 !important;
      }
      .mb-summary-text ul li {
        list-style-type: disc !important;
      }
      .mb-summary-text ol li {
        list-style-type: decimal !important;
      }
      .mb-summary-text ul ul, .mb-summary-text ol ul {
        list-style-type: circle !important;
      }
      .mb-summary-text blockquote {
        border-left: 3px solid #667eea !important;
        padding-left: 16px !important;
        margin: 12px 0 !important;
        color: #aaa !important;
        font-style: italic !important;
      }
      .mb-summary-text a {
        color: #667eea !important;
        text-decoration: none !important;
        border-bottom: 1px solid rgba(102, 126, 234, 0.3) !important;
        transition: all 0.2s !important;
      }
      .mb-summary-text a:hover {
        color: #8b9ff4 !important;
        border-bottom-color: #8b9ff4 !important;
      }
      .mb-summary-text hr {
        border: none !important;
        height: 1px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        margin: 16px 0 !important;
      }
      .mb-summary-text table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 12px 0 !important;
        font-size: 13px !important;
      }
      .mb-summary-text th, .mb-summary-text td {
        padding: 8px 12px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        text-align: left !important;
      }
      .mb-summary-text th {
        background: rgba(102, 126, 234, 0.2) !important;
        font-weight: 600 !important;
        color: #fff !important;
      }
      .mb-summary-text tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.02) !important;
      }
      .mb-key-points {
        background: rgba(102, 126, 234, 0.1) !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin-bottom: 20px !important;
      }
      .mb-key-points-title { font-size: 12px !important; color: #667eea !important; font-weight: 600 !important; margin-bottom: 12px !important; }
      .mb-key-point {
        display: flex !important;
        gap: 10px !important;
        padding: 8px 0 !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      .mb-key-point:last-child { border-bottom: none !important; }
      .mb-key-point-bullet {
        width: 6px !important;
        height: 6px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-radius: 50% !important;
        flex-shrink: 0 !important;
        margin-top: 6px !important;
      }
      /* Markdown styles for key points */
      .mb-key-point > div:last-child {
        flex: 1 !important;
      }
      .mb-key-point > div:last-child p {
        margin: 0 !important;
      }
      .mb-key-point > div:last-child strong {
        font-weight: 600 !important;
        color: #fff !important;
      }
      .mb-key-point > div:last-child em {
        font-style: italic !important;
      }
      .mb-key-point > div:last-child code {
        background: rgba(102, 126, 234, 0.2) !important;
        padding: 1px 4px !important;
        border-radius: 3px !important;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace !important;
        font-size: 12px !important;
        color: #a5b4fc !important;
      }
      .mb-key-point > div:last-child a {
        color: #667eea !important;
        text-decoration: none !important;
      }
      .mb-key-point > div:last-child a:hover {
        text-decoration: underline !important;
      }
      .mb-sources-title { font-size: 12px !important; color: #888 !important; text-transform: uppercase !important; letter-spacing: 1px !important; margin-bottom: 12px !important; }
      .mb-source-card {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 10px !important;
        padding: 14px !important;
        margin-bottom: 10px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        border: 1px solid transparent !important;
      }
      .mb-source-card:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(102, 126, 234, 0.3) !important;
        transform: translateY(-2px) !important;
      }
      .mb-source-title { font-size: 13px !important; color: #e8e8e8 !important; font-weight: 500 !important; margin-bottom: 4px !important; }
      .mb-source-url { font-size: 11px !important; color: #667eea !important; word-break: break-all !important; }
  `;
}

/**
 * Product result styles for Magic Bar
 * @returns {string} - CSS styles string
 */
function getProductResultStyles() {
  return `
      .mb-product {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 14px !important;
        margin-bottom: 16px !important;
        overflow: hidden !important;
        transition: all 0.2s !important;
        cursor: pointer !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      .mb-product:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) !important;
        border-color: rgba(102, 126, 234, 0.3) !important;
      }
      .mb-product.has-price { border-color: rgba(76, 175, 80, 0.3) !important; }
      .mb-product-inner { padding: 18px !important; }
      .mb-product-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; margin-bottom: 12px !important; }
      .mb-product-source {
        font-size: 10px !important;
        font-weight: 700 !important;
        padding: 5px 10px !important;
        border-radius: 6px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      .mb-src-amazon { background: #ff9900 !important; color: #000 !important; }
      .mb-src-lazada { background: #0f146d !important; color: #fff !important; }
      .mb-src-shopee { background: #ee4d2d !important; color: #fff !important; }
      .mb-src-aliexpress { background: #e62e04 !important; color: #fff !important; }
      .mb-src-ebay { background: #0064d2 !important; color: #fff !important; }
      .mb-src-walmart { background: #0071ce !important; color: #fff !important; }
      .mb-src-target { background: #cc0000 !important; color: #fff !important; }
      .mb-src-bestbuy { background: #0046be !important; color: #fff !important; }
      .mb-src-etsy { background: #f56400 !important; color: #fff !important; }
      .mb-src-temu { background: #ff6f00 !important; color: #fff !important; }
      .mb-src-default { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: #fff !important; }
      .mb-verified { font-size: 10px !important; color: #4caf50 !important; display: flex !important; align-items: center !important; gap: 4px !important; }
      .mb-product-title {
        font-size: 15px !important;
        font-weight: 500 !important;
        color: #fff !important;
        line-height: 1.4 !important;
        margin-bottom: 10px !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }
      .mb-product-price {
        font-size: 22px !important;
        font-weight: 700 !important;
        color: #4caf50 !important;
        margin-bottom: 10px !important;
      }
      .mb-product-desc {
        font-size: 12px !important;
        color: #888 !important;
        line-height: 1.5 !important;
        margin-bottom: 14px !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }
      .mb-view-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 10px 20px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        text-decoration: none !important;
      }
      .mb-view-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important; }
      .mb-no-price { font-size: 13px !important; color: #888 !important; font-style: italic !important; margin-bottom: 10px !important; }
  `;
}

/**
 * Get all Magic Bar panel styles combined
 * @returns {string} - Complete CSS styles string for Magic Bar panel
 */
export function getMagicBarPanelStyles() {
  return getBasePanelStyles({ width: 440, accentGradient: '#667eea 0%, #764ba2 100%' })
    + getInfoResultStyles()
    + getProductResultStyles();
}

/**
 * Image panel specific styles
 * @returns {string} - CSS styles string for image panel
 */
function getImagePanelSpecificStyles() {
  return `
      .mb-stat.highlight { background: rgba(240, 147, 251, 0.2) !important; color: #f093fb !important; }
      .mb-description {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px !important;
        padding: 16px !important;
        margin-bottom: 20px !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #ccc !important;
      }
      .mb-images-grid {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
        gap: 16px !important;
      }
      .mb-image-card {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        transition: all 0.2s !important;
      }
      .mb-image-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) !important;
        border-color: rgba(240, 147, 251, 0.3) !important;
      }
      .mb-image-wrapper {
        position: relative !important;
        width: 100% !important;
        padding-bottom: 100% !important;
        background: rgba(0, 0, 0, 0.3) !important;
      }
      .mb-image-wrapper img {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        cursor: pointer !important;
      }
      .mb-image-actions {
        padding: 12px !important;
        display: flex !important;
        gap: 8px !important;
      }
      .mb-download-btn {
        flex: 1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        padding: 10px !important;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        text-decoration: none !important;
      }
      .mb-download-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4) !important; }
      .mb-fullscreen-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.9) !important;
        z-index: 2147483648 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: zoom-out !important;
      }
      .mb-fullscreen-overlay img {
        max-width: 90vw !important;
        max-height: 90vh !important;
        object-fit: contain !important;
        border-radius: 8px !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
      }
  `;
}

/**
 * Get all Image panel styles combined
 * @returns {string} - Complete CSS styles string for Image Generator panel
 */
export function getImagePanelStyles() {
  return getBasePanelStyles({ width: 480, accentGradient: '#f093fb 0%, #f5576c 100%' })
    + getImagePanelSpecificStyles();
}
