/**
 * Content insertion script generator
 */

import { ScriptBuilder, stylesToCSS } from '../script-builder.js';
import { ELEMENT_IDS, getMainContentSelector, mergeConfig } from '../config.js';

/**
 * Default styles for inserted content containers
 */
const DEFAULT_STYLES = {
  container: {
    background: '#f0f7ff',
    border: '1px solid #007bff',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px auto',
    maxWidth: '800px',
    fontFamily: 'sans-serif',
  },
  title: {
    margin: '0 0 12px 0',
    color: '#0056b3',
  },
  content: {
    color: '#333',
    lineHeight: '1.6',
    whiteSpace: 'pre-line',
  },
};

/**
 * Style presets for different content types
 */
export const STYLE_PRESETS = {
  info: {
    container: { ...DEFAULT_STYLES.container, background: '#f0f7ff', borderColor: '#007bff' },
    title: { ...DEFAULT_STYLES.title, color: '#0056b3' },
  },
  success: {
    container: { ...DEFAULT_STYLES.container, background: '#f0fff4', borderColor: '#28a745' },
    title: { ...DEFAULT_STYLES.title, color: '#155724' },
  },
  warning: {
    container: { ...DEFAULT_STYLES.container, background: '#fff3cd', borderColor: '#ffc107' },
    title: { ...DEFAULT_STYLES.title, color: '#856404' },
  },
  error: {
    container: { ...DEFAULT_STYLES.container, background: '#fff5f5', borderColor: '#dc3545' },
    title: { ...DEFAULT_STYLES.title, color: '#721c24' },
  },
  neutral: {
    container: { ...DEFAULT_STYLES.container, background: '#f8f9fa', borderColor: '#6c757d' },
    title: { ...DEFAULT_STYLES.title, color: '#495057' },
  },
};

/**
 * Position configurations for floating panels
 */
const POSITION_STYLES = {
  'top-left': 'top:20px;left:20px',
  'top-right': 'top:20px;right:20px',
  'bottom-left': 'bottom:20px;left:20px',
  'bottom-right': 'bottom:20px;right:20px',
  center: 'top:50%;left:50%;transform:translate(-50%,-50%)',
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  position: 'top',
  targetSelector: getMainContentSelector(),
  preset: 'info',
  customStyles: {},
};

/**
 * Generates a content insertion script
 */
export function generateContentInsertionScript(options) {
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const { content, title = null, position, targetSelector, preset, customStyles } = config;

  const styles = STYLE_PRESETS[preset] || STYLE_PRESETS.info;
  const containerStyles = stylesToCSS({ ...styles.container, ...customStyles.container });
  const titleStyles = stylesToCSS({ ...styles.title, ...customStyles.title });
  const contentStyles = stylesToCSS({ ...DEFAULT_STYLES.content, ...customStyles.content });

  const titleCode = title
    ? `
  const title = document.createElement('h3');
  title.textContent = ${JSON.stringify(title)};
  title.style.cssText = '${titleStyles}';
  container.appendChild(title);`
    : '';

  const insertionCode =
    position === 'bottom'
      ? 'insertTarget.appendChild(container);'
      : position === 'replace'
        ? 'insertTarget.innerHTML = ""; insertTarget.appendChild(container);'
        : 'insertTarget.insertBefore(container, insertTarget.firstChild);';

  const code = `
const contentToAdd = ${JSON.stringify(content)};

const container = document.createElement('div');
container.id = '${ELEMENT_IDS.addedContent}';
container.style.cssText = '${containerStyles}';
${titleCode}

const contentEl = document.createElement('div');
contentEl.textContent = contentToAdd;
contentEl.style.cssText = '${contentStyles}';
container.appendChild(contentEl);

const insertTarget = document.querySelector('${targetSelector}') || document.body;
${insertionCode}

console.log('[Browser Wand] Inserted content at', '${position}', 'of target');`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a script to insert HTML content
 */
export function generateHTMLInsertionScript(html, targetSelector, position = 'afterbegin') {
  const code = `
const html = ${JSON.stringify(html)};
const target = document.querySelector('${targetSelector}');

if (target) {
  target.insertAdjacentHTML('${position}', html);
  console.log('[Browser Wand] Inserted HTML content');
} else {
  console.warn('[Browser Wand] Could not find target:', '${targetSelector}');
}`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a script to create a floating panel
 */
export function generateFloatingPanelScript(options) {
  const { content, title = 'Browser Wand', position = 'bottom-right', width = '300px', closeable = true } = options;

  const posStyle = POSITION_STYLES[position] || POSITION_STYLES['bottom-right'];

  const closeButton = closeable
    ? `
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;border:none;background:none;font-size:20px;cursor:pointer;color:#666;';
  closeBtn.onclick = () => panel.remove();
  header.appendChild(closeBtn);`
    : '';

  const code = `
const panel = document.createElement('div');
panel.id = '${ELEMENT_IDS.floatingPanel}';
panel.style.cssText = 'position:fixed;${posStyle};width:${width};background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;font-family:sans-serif;overflow:hidden;';

const header = document.createElement('div');
header.style.cssText = 'position:relative;padding:12px 16px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;';
const titleEl = document.createElement('h4');
titleEl.textContent = ${JSON.stringify(title)};
titleEl.style.cssText = 'margin:0;font-size:14px;color:#333;';
header.appendChild(titleEl);
${closeButton}

const body = document.createElement('div');
body.style.cssText = 'padding:16px;max-height:400px;overflow-y:auto;';
body.textContent = ${JSON.stringify(content)};

panel.appendChild(header);
panel.appendChild(body);
document.body.appendChild(panel);

console.log('[Browser Wand] Created floating panel');`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a script to create a notification toast
 */
export function generateToastScript(message, options = {}) {
  const { duration = 3000, type = 'info', position = 'bottom-right' } = options;
  const posStyle = POSITION_STYLES[position] || POSITION_STYLES['bottom-right'];
  const styles = STYLE_PRESETS[type] || STYLE_PRESETS.info;

  const code = `
const toast = document.createElement('div');
toast.style.cssText = 'position:fixed;${posStyle};padding:12px 20px;border-radius:8px;background:${styles.container.background};border:1px solid ${styles.container.borderColor || '#007bff'};color:${styles.title.color};font-family:sans-serif;font-size:14px;z-index:999999;box-shadow:0 2px 10px rgba(0,0,0,0.1);transition:opacity 0.3s;';
toast.textContent = ${JSON.stringify(message)};

document.body.appendChild(toast);

setTimeout(() => {
  toast.style.opacity = '0';
  setTimeout(() => toast.remove(), 300);
}, ${duration});`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a script to create an expandable section
 */
export function generateExpandableSectionScript(options) {
  const { title, content, expanded = false, targetSelector = 'body' } = options;
  const styles = STYLE_PRESETS.info;

  const code = `
const section = document.createElement('div');
section.style.cssText = 'margin:16px 0;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;';

const header = document.createElement('div');
header.style.cssText = 'padding:12px 16px;background:#f5f5f5;cursor:pointer;display:flex;justify-content:space-between;align-items:center;';
header.innerHTML = '<span>${title}</span><span style="transition:transform 0.3s;">▼</span>';

const body = document.createElement('div');
body.style.cssText = 'padding:16px;display:${expanded ? 'block' : 'none'};';
body.textContent = ${JSON.stringify(content)};

header.onclick = () => {
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  header.querySelector('span:last-child').style.transform = isHidden ? 'rotate(180deg)' : '';
};

section.appendChild(header);
section.appendChild(body);

const target = document.querySelector('${targetSelector}') || document.body;
target.appendChild(section);`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Template for content insertion (for LLM-generated content)
 */
export const CONTENT_INSERTION_TEMPLATE = `
(function() {
  const contentToAdd = "Your generated content here";

  const container = document.createElement('div');
  container.id = '${ELEMENT_IDS.addedContent}';
  container.style.cssText = '${stylesToCSS(DEFAULT_STYLES.container)}';

  const title = document.createElement('h3');
  title.textContent = 'Summary';
  title.style.cssText = '${stylesToCSS(DEFAULT_STYLES.title)}';
  container.appendChild(title);

  const content = document.createElement('div');
  content.textContent = contentToAdd;
  content.style.cssText = '${stylesToCSS(DEFAULT_STYLES.content)}';
  container.appendChild(content);

  const insertTarget = document.querySelector('${getMainContentSelector()}') || document.body;
  insertTarget.insertBefore(container, insertTarget.firstChild);
})();`;
