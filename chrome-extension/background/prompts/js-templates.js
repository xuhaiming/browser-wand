/**
 * JavaScript code templates for page modification
 *
 * This file provides backward-compatible exports from the new modular
 * js-templates architecture. For new code, prefer importing directly
 * from './js-templates/index.js' for better tree-shaking.
 *
 * @module js-templates
 */

// Import from modular structure
import {
  generateContentExtractionScript,
  generateAdRemovalScript,
  getTranslationScriptTemplate,
  SELECTIVE_HIDING_TEMPLATE,
  CONTENT_INSERTION_TEMPLATE as ContentInsertionTemplate,
} from './js-templates/index.js';

/**
 * Content extraction script template for reader mode
 * @returns {string} - Injectable script
 */
export function getContentExtractionScript() {
  return generateContentExtractionScript();
}

/**
 * Selective element hiding script template
 * Used when LLM generates specific selectors to hide
 */
export const SELECTIVE_HIDING_SCRIPT = SELECTIVE_HIDING_TEMPLATE;

/**
 * Ad removal script template
 * Complete script for removing ads with mutation observer
 */
export const AD_REMOVAL_SCRIPT = generateAdRemovalScript();

/**
 * Translation script template
 * Template with placeholders for translated content
 */
export const TRANSLATION_SCRIPT_TEMPLATE = getTranslationScriptTemplate();

/**
 * Content insertion script template
 * Template for adding generated content to pages
 */
export const CONTENT_INSERTION_TEMPLATE = ContentInsertionTemplate;

// Re-export everything from the modular structure for advanced usage
export * from './js-templates/index.js';
