/**
 * Image panel generator
 * Generates JavaScript code to display generated images in a sidebar panel
 */

import { getImagePanelStyles } from './panel-styles.js';

/**
 * Generates JavaScript code to display generated images in a sidebar panel
 * @param {Object} imageResult - Image generation result from generateImages
 * @param {string} originalPrompt - The original user prompt
 * @returns {string} - JavaScript code string
 */
export function generateImageDisplayCode(imageResult, originalPrompt) {
  const images = imageResult.images || [];
  const description = imageResult.description || '';
  const success = imageResult.success;
  const styles = getImagePanelStyles();

  return `
(function() {
  const IMAGES = ${JSON.stringify(images)};
  const DESCRIPTION = ${JSON.stringify(description)};
  const PROMPT = ${JSON.stringify(originalPrompt)};
  const SUCCESS = ${success};

  // Remove existing panel if present
  const existingPanel = document.getElementById('bw-magic-bar-panel');
  if (existingPanel) existingPanel.remove();
  const existingToggle = document.getElementById('bw-magic-toggle');
  if (existingToggle) existingToggle.remove();

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'bw-magic-bar-panel';
  panel.innerHTML = \`
    <style>${styles}</style>
    <div class="mb-header">
      <div class="mb-header-top">
        <div class="mb-logo">
          <div class="mb-logo-icon">🎨</div>
          <div>
            <h3 class="mb-title">Image Generator</h3>
            <div class="mb-subtitle">Nano Banana Pro</div>
          </div>
        </div>
        <button class="mb-close" id="mb-close">×</button>
      </div>
      <div class="mb-query">
        <div class="mb-query-label">Generated from</div>
        <div class="mb-query-text">\${PROMPT}</div>
      </div>
      \${SUCCESS && IMAGES.length > 0 ? \`
        <div class="mb-stats">
          <span class="mb-stat highlight">\${IMAGES.length} image\${IMAGES.length > 1 ? 's' : ''} generated</span>
        </div>
      \` : ''}
    </div>
    <div class="mb-content">
      \${SUCCESS && IMAGES.length > 0 ? \`
        \${DESCRIPTION ? \`<div class="mb-description">\${DESCRIPTION}</div>\` : ''}
        <div class="mb-images-grid">
          \${IMAGES.map((img, idx) => \`
            <div class="mb-image-card">
              <div class="mb-image-wrapper">
                <img src="data:\${img.mimeType};base64,\${img.data}" alt="Generated image \${idx + 1}" data-idx="\${idx}" />
              </div>
              <div class="mb-image-actions">
                <a href="data:\${img.mimeType};base64,\${img.data}" download="generated-image-\${idx + 1}.png" class="mb-download-btn">
                  ⬇ Download
                </a>
              </div>
            </div>
          \`).join('')}
        </div>
      \` : \`
        <div class="mb-no-results">
          <div class="mb-no-results-icon">🖼️</div>
          <div class="mb-no-results-text">No images could be generated.<br>Please try a different prompt.</div>
        </div>
      \`}
    </div>
    <div class="mb-footer">
      <div class="mb-footer-text">Powered by <span>Nano Banana Pro</span></div>
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

  // Fullscreen view on image click
  panel.querySelectorAll('.mb-image-wrapper img').forEach(img => {
    img.onclick = function(e) {
      e.stopPropagation();
      const overlay = document.createElement('div');
      overlay.className = 'mb-fullscreen-overlay';
      overlay.innerHTML = '<img src="' + this.src + '" alt="Full size image" />';
      overlay.onclick = function() { this.remove(); };
      document.body.appendChild(overlay);
    };
  });

  console.log('[Browser Wand] Image Generator panel rendered:', IMAGES.length + ' images');
})();`;
}
