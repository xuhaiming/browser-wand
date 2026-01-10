/**
 * JavaScript code templates for page modification
 *
 * This module provides a clean, modular API for generating injectable JavaScript
 * scripts for various page modification tasks.
 *
 * Architecture:
 * - config.js: Shared configuration constants and defaults
 * - script-builder.js: Core utilities for building scripts (ScriptBuilder class)
 * - dom-utils.js: Reusable DOM manipulation functions
 * - ad-patterns.js: Ad detection patterns and configurations
 * - scripts/: Task-specific script generators
 *
 * Usage:
 * ```js
 * import { ScriptBuilder, generateAdRemovalScript } from './js-templates/index.js';
 *
 * // Use a pre-built generator
 * const adScript = generateAdRemovalScript();
 *
 * // Or build a custom script
 * const customScript = ScriptBuilder.create()
 *   .useStrict()
 *   .constant('CONFIG', { debug: true })
 *   .section('console.log("Hello");')
 *   .build();
 * ```
 */

// ============================================================================
// Configuration
// ============================================================================

export {
  CONTENT_THRESHOLDS,
  ELEMENT_SELECTORS,
  ELEMENT_IDS,
  CSS_CLASSES,
  MARKERS,
  LOG_PREFIX,
  LOG_PREFIX_BRACKETS,
  WARNING_MESSAGES,
  STYLE_PRESETS,
  mergeConfig,
  getMainContentSelector,
} from './config.js';

// ============================================================================
// Script Builder Utilities
// ============================================================================

export {
  // Core wrappers
  wrapInIIFE,
  wrapInAsyncIIFE,
  // Constants
  createConstant,
  createRawConstant,
  createConstants,
  // Building
  buildScript,
  ScriptBuilder,
  // Style injection
  injectStyleCode,
  stylesToCSS,
  // Observer and timing
  createObserverCode,
  createObserverCallback,
  delayedExecution,
  rafExecution,
  // Logging
  createLog,
  // Element creation
  createElementCode,
  createForEach,
  createQueryWithFallback,
  // Template processing
  replacePlaceholders,
  createFunction,
  createConditional,
  // Utilities
  joinSections,
  indent,
} from './script-builder.js';

// ============================================================================
// DOM Utilities
// ============================================================================

export {
  // Content finding
  CONTENT_FINDER,
  TEXT_DENSITY_FINDER,
  MAIN_CONTENT_LOCATOR,
  generateContentFinder,
  // Element marking
  getMarkerUtils,
  getTitlePreserver,
  getNonPreservedHider,
  // Warning and UI
  WARNING_DISPLAY,
  generateWarningDisplay,
  // Safe hiding
  SAFE_ELEMENT_HIDER,
  generateSafeHider,
  // Pattern matching
  PATTERN_MATCHER,
  generatePatternMatcher,
  // DOM manipulation
  generateStyleApplier,
  generateElementHider,
  generateSpaceCollapse,
  // Utility combiners
  combineUtilities,
  getContentExtractionUtilities,
  getHidingUtilities,
} from './dom-utils.js';

// ============================================================================
// Ad Patterns
// ============================================================================

export {
  AD_PATTERNS,
  AD_DATA_ATTRIBUTES,
  AD_ARIA_PATTERNS,
  AD_IFRAME_PATTERNS,
  AD_CONTAINER_SELECTORS,
  serializePatterns,
  getSerializedAdPatterns,
  generatePatternMatcherCode,
} from './ad-patterns.js';

// ============================================================================
// Script Generators
// ============================================================================

export * from './scripts/index.js';
