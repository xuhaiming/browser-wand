/**
 * Task-specific prompt templates for page modification
 *
 * This file is maintained for backward compatibility.
 * The code has been refactored into a modular structure:
 *
 * - selectors.js: CSS selector configurations
 * - css-templates.js: CSS generation utilities
 * - js-templates.js: JavaScript code templates
 * - prompts/: Individual prompt files for each task type
 * - index.js: Main module entry point
 *
 * Design principles:
 * - Generic selectors that work across any website
 * - Reusable selector categories for consistency
 * - Configurable templates for easy maintenance
 */

// Re-export everything from the new modular structure
export {
  // Prompts
  CONTENT_EXTRACTION_PROMPT,
  AD_REMOVAL_PROMPT,
  COMMENT_REMOVAL_PROMPT,
  ELEMENT_HIDING_PROMPT,
  STYLING_PROMPT,
  THEMATIC_RESKINNING_PROMPT,
  TRANSLATION_PROMPT,
  GENERAL_PROMPT,
  SUMMARIZE_PROMPT,
  ANALYZE_PROMPT,
  // Selectors
  CONTENT_SELECTORS,
  NON_CONTENT_SELECTORS,
  EXCLUSION_PATTERNS,
  MARKERS,
  getAllContentSelectors,
  formatSelectorsForPrompt,
  // CSS templates
  generateHidingCSS,
  AD_REMOVAL_CSS,
  TRANSLATION_CSS,
  READER_MODE_STYLES,
  // JS templates
  getContentExtractionScript,
  SELECTIVE_HIDING_SCRIPT,
  AD_REMOVAL_SCRIPT,
  TRANSLATION_SCRIPT_TEMPLATE,
} from './index.js';

// Legacy aliases for backward compatibility
import {
  CONTENT_SELECTORS,
  NON_CONTENT_SELECTORS,
  MARKERS,
} from './selectors.js';

import {
  hideMarkedElements,
  hideNonContentElements,
  hideSidebar,
  hideRelatedContent,
  hideSocialElements,
  hideComments,
  hideAds,
  hideMiscElements,
  READER_MODE_STYLES,
} from './css-templates.js';

/**
 * @deprecated Use imports from './selectors.js' instead
 */
export const SELECTORS = {
  content: CONTENT_SELECTORS,
  nonContent: NON_CONTENT_SELECTORS,
  exclusionPatterns: ['comment', 'sidebar', 'footer', 'header', 'nav', 'menu', 'ad-', 'related'],
};

/**
 * @deprecated Use imports from './css-templates.js' instead
 */
export const CSS_TEMPLATES = {
  markers: MARKERS,
  hideMarkedElements: hideMarkedElements(),
  hideNonContentElements,
  hideSidebar,
  hideRelatedContent,
  hideSocialElements,
  hideComments,
  hideAds,
  hideMiscElements,
  readerModeStyles: READER_MODE_STYLES,
};

/**
 * @deprecated Use imports from './js-templates.js' instead
 */
export { getContentExtractionScript as JS_TEMPLATES } from './js-templates.js';
