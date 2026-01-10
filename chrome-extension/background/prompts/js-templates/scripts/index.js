/**
 * Script generators index
 * Re-exports all script generation functions
 */

// Content extraction
export {
  generateContentExtractionScript,
  generateSimpleContentExtraction,
  generateContentRetrieval,
} from './content-extraction.js';

// Ad removal
export {
  generateAdRemovalScript,
  generateSelectiveAdRemoval,
  generateConfigurableAdRemoval,
} from './ad-removal.js';

// Translation
export {
  getTranslationScriptTemplate,
  generateTranslationScript,
  generateInlineTranslationScript,
  generateTargetedTranslationScript,
} from './translation.js';

// Selective hiding
export {
  generateSelectiveHidingScript,
  generateCriteriaBasedHiding,
  generateRegexBasedHiding,
  SELECTIVE_HIDING_TEMPLATE,
} from './selective-hiding.js';

// Content insertion
export {
  generateContentInsertionScript,
  generateHTMLInsertionScript,
  generateFloatingPanelScript,
  generateToastScript,
  generateExpandableSectionScript,
  STYLE_PRESETS,
  CONTENT_INSERTION_TEMPLATE,
} from './content-insertion.js';
