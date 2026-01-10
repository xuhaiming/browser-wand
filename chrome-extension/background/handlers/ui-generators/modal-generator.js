/**
 * Modal display code generator
 * Generates JavaScript code to display content in modal overlays
 */

const OVERLAY_ID = 'browser-wand-modal-overlay';

const MODAL_STYLES = {
  overlay: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;',
  modal: 'background:#fff;border-radius:12px;max-width:800px;max-height:80vh;overflow:auto;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;',
  closeBtn: 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#666;line-height:1;',
  title: 'margin:0 0 20px 0;color:#333;font-size:24px;padding-right:30px;',
  content: 'color:#444;font-size:16px;line-height:1.7;',
};

/**
 * Generates markdown to HTML conversion code
 * @returns {string} - JavaScript code for markdown parsing
 */
function getMarkdownParsingCode() {
  return `
    const formatted = content
      .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:16px 0 8px;color:#333;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:20px 0 10px;color:#333;">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="margin:24px 0 12px;color:#333;">$1</h2>')
      .replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;">$1</li>')
      .replace(/\\n/g, '<br>');
    contentEl.innerHTML = formatted;`;
}

/**
 * Generates plain text display code
 * @returns {string} - JavaScript code for plain text display
 */
function getPlainTextCode() {
  return `contentEl.style.whiteSpace = 'pre-wrap';
    contentEl.textContent = content;`;
}

/**
 * Generates JavaScript code to display content in a modal overlay
 * @param {string} content - The content to display
 * @param {string} title - The modal title
 * @param {Object} options - Display options
 * @param {boolean} options.parseMarkdown - Whether to parse markdown formatting
 * @returns {string} - JavaScript code string
 */
export function generateModalDisplayCode(content, title, { parseMarkdown = false } = {}) {
  const contentProcessing = parseMarkdown ? getMarkdownParsingCode() : getPlainTextCode();

  return `
(function() {
  var content = ${JSON.stringify(content)};
  var modalTitle = ${JSON.stringify(title)};

  var overlay = document.createElement('div');
  overlay.id = '${OVERLAY_ID}';
  overlay.style.cssText = '${MODAL_STYLES.overlay}';

  var modal = document.createElement('div');
  modal.style.cssText = '${MODAL_STYLES.modal}';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = '${MODAL_STYLES.closeBtn}';
  closeBtn.onclick = function() { overlay.remove(); };

  var titleEl = document.createElement('h2');
  titleEl.textContent = modalTitle;
  titleEl.style.cssText = '${MODAL_STYLES.title}';

  var contentEl = document.createElement('div');
  contentEl.style.cssText = '${MODAL_STYLES.content}';
  ${contentProcessing}

  modal.appendChild(closeBtn);
  modal.appendChild(titleEl);
  modal.appendChild(contentEl);
  overlay.appendChild(modal);

  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };

  document.body.appendChild(overlay);
})();`;
}
