/**
 * Shared configuration for JavaScript template generation
 * Centralized constants and defaults used across all script generators
 */

import { MARKERS } from '../selectors.js';

/**
 * Default thresholds for content detection
 */
export const CONTENT_THRESHOLDS = {
  minContentLength: 300,
  minFallbackLength: 500,
  minParagraphLength: 50,
  minSubstantialText: 1000,
};

/**
 * Common element selectors
 */
export const ELEMENT_SELECTORS = {
  mainContent: [
    '[itemprop="articleBody"]',
    'article',
    'main',
    '[role="main"]',
    '[class*="article-content"]',
    '[class*="post-content"]',
    '[class*="entry-content"]',
  ],
  contentCandidates: 'div, section, article',
  headings: 'h1, h2, h3',
  paragraphs: 'p',
};

/**
 * Browser Wand element IDs
 */
export const ELEMENT_IDS = {
  mainContent: 'browser-wand-main-content',
  warning: 'browser-wand-warning',
  addedContent: 'browser-wand-added-content',
  floatingPanel: 'browser-wand-floating-panel',
  readerStyle: 'browser-wand-reader-style',
};

/**
 * CSS class names for generated elements
 */
export const CSS_CLASSES = {
  bilingualContainer: 'bw-bilingual-container',
  originalText: 'bw-original-text',
  translatedText: 'bw-translated-text',
  translationLabel: 'bw-translation-label',
  headingTranslation: 'bw-heading-translation',
  inlineTranslation: 'bw-inline-translation',
  translationToggle: 'bw-translation-toggle',
};

/**
 * Data attribute markers (re-export from selectors for convenience)
 */
export { MARKERS };

/**
 * Logging configuration
 */
export const LOG_PREFIX = 'Browser Wand';
export const LOG_PREFIX_BRACKETS = '[Browser Wand]';

/**
 * Default warning messages
 */
export const WARNING_MESSAGES = {
  noContent: 'Browser Wand: Could not detect main article content. Please try a more specific request.',
  invalidSelector: 'Browser Wand: Invalid selector',
  skippingMainContent: 'Browser Wand: Skipping to protect main content',
  skippingSubstantialText: 'Browser Wand: Skipping element with substantial text',
};

/**
 * Style presets for UI elements
 */
export const STYLE_PRESETS = {
  warning: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    background: '#fff3cd',
    color: '#856404',
    padding: '10px',
    textAlign: 'center',
    zIndex: '999999',
    fontSize: '14px',
  },
  info: {
    background: '#f0f7ff',
    border: '1px solid #007bff',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px auto',
    maxWidth: '800px',
    fontFamily: 'sans-serif',
  },
  success: {
    background: '#f0fff4',
    border: '1px solid #28a745',
    borderRadius: '8px',
    padding: '20px',
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #dc3545',
    borderRadius: '8px',
    padding: '20px',
  },
  neutral: {
    background: '#f8f9fa',
    border: '1px solid #6c757d',
    borderRadius: '8px',
    padding: '20px',
  },
};

/**
 * Merge configurations with defaults
 */
export function mergeConfig(defaults, overrides = {}) {
  return { ...defaults, ...overrides };
}

/**
 * Get main content selector string
 */
export function getMainContentSelector() {
  return ELEMENT_SELECTORS.mainContent.join(', ');
}
