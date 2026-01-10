/**
 * Prompts module - Main entry point
 *
 * This module provides task-specific prompt templates for page modification.
 *
 * Design principles:
 * - Generic selectors that work across any website
 * - Reusable selector categories for consistency
 * - Configurable templates for easy maintenance
 * - Modular structure for better organization
 */

// Base rules
export { BASE_RULES, JSON_RESPONSE_FORMAT } from './base-rules.js';

// Selectors
export {
  CONTENT_SELECTORS,
  NON_CONTENT_SELECTORS,
  EXCLUSION_PATTERNS,
  MARKERS,
  getAllContentSelectors,
  formatSelectorsForPrompt,
} from './selectors.js';

// CSS templates
export {
  hideMarkedElements,
  hideNonContentElements,
  hideSidebar,
  hideRelatedContent,
  hideSocialElements,
  hideComments,
  hideAds,
  hideMiscElements,
  READER_MODE_STYLES,
  generateHidingCSS,
  AD_REMOVAL_CSS,
  TRANSLATION_CSS,
  generateCommentRemovalCSS,
} from './css-templates.js';

// JavaScript templates
export {
  getContentExtractionScript,
  SELECTIVE_HIDING_SCRIPT,
  AD_REMOVAL_SCRIPT,
  TRANSLATION_SCRIPT_TEMPLATE,
  CONTENT_INSERTION_TEMPLATE,
} from './js-templates.js';

// Task prompts
export {
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
} from './prompts/index.js';
