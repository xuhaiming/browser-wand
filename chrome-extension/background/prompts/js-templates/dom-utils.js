/**
 * Reusable DOM utility functions for injectable scripts
 * These are string templates that get included in generated scripts
 */

import {
  CONTENT_THRESHOLDS,
  ELEMENT_SELECTORS,
  ELEMENT_IDS,
  MARKERS,
  WARNING_MESSAGES,
  STYLE_PRESETS,
  getMainContentSelector,
} from './config.js';
import { stylesToCSS } from './script-builder.js';

// ============================================================================
// Content Finding Utilities
// ============================================================================

/**
 * Content finder - finds main content using selector priorities
 */
export const CONTENT_FINDER = `
function findMainContent(selectors, minLength = ${CONTENT_THRESHOLDS.minContentLength}) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && (el.textContent || '').trim().length > minLength) {
        return { element: el, selector };
      }
    } catch (e) { /* Invalid selector */ }
  }
  return null;
}`;

/**
 * Text density finder - fallback for finding content by text density
 */
export const TEXT_DENSITY_FINDER = `
function findByTextDensity(excludePatterns, minLength = ${CONTENT_THRESHOLDS.minFallbackLength}) {
  const candidates = document.querySelectorAll('${ELEMENT_SELECTORS.contentCandidates}');
  let best = { element: null, score: 0 };

  candidates.forEach(el => {
    const text = (el.textContent || '').trim();
    const childCount = el.querySelectorAll('*').length || 1;
    const score = text.length / Math.sqrt(childCount);

    if (text.length > minLength && score > best.score) {
      const identifier = ((el.className || '') + (el.id || '')).toLowerCase();
      const isExcluded = excludePatterns.some(p => identifier.includes(p));

      if (!isExcluded) {
        best = { element: el, score };
      }
    }
  });

  return best.element ? { element: best.element, selector: 'fallback-density' } : null;
}`;

/**
 * Main content locator - finds the main content area using common selectors
 */
export const MAIN_CONTENT_LOCATOR = `
function findMainContentArea(minLength = ${CONTENT_THRESHOLDS.minContentLength}) {
  const contentSelectors = ${JSON.stringify(ELEMENT_SELECTORS.mainContent)};

  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > minLength) {
      return el;
    }
  }
  return document.body;
}`;

/**
 * Generates a configurable content finder
 */
export function generateContentFinder(options = {}) {
  const { minLength = CONTENT_THRESHOLDS.minContentLength, selectors = ELEMENT_SELECTORS.mainContent } = options;

  return `
function findMainContent() {
  const selectors = ${JSON.stringify(selectors)};
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && (el.textContent || '').trim().length > ${minLength}) {
        return { element: el, selector };
      }
    } catch (e) {}
  }
  return null;
}`;
}

// ============================================================================
// Element Marking Utilities
// ============================================================================

/**
 * Element marker - marks element and ancestors for preservation
 */
export function getMarkerUtils(preserveAttr = MARKERS.preserve, ancestorAttr = MARKERS.preserveAncestor) {
  return `
function markForPreservation(element) {
  element.setAttribute('${preserveAttr}', 'true');
  element.id = element.id || '${ELEMENT_IDS.mainContent}';

  let ancestor = element.parentElement;
  while (ancestor && ancestor !== document.body) {
    ancestor.setAttribute('${ancestorAttr}', 'true');
    ancestor = ancestor.parentElement;
  }
}`;
}

/**
 * Title preservation - preserves h1 if it matches page title
 */
export function getTitlePreserver(preserveAttr = MARKERS.preserve, ancestorAttr = MARKERS.preserveAncestor) {
  return `
function preserveTitle(mainContent) {
  const h1 = document.querySelector('h1');
  if (!h1 || mainContent.contains(h1)) return;

  const h1Text = h1.textContent.trim().toLowerCase();
  const pageTitle = document.title.toLowerCase();

  if (pageTitle.includes(h1Text.substring(0, 30)) || h1Text.includes(pageTitle.substring(0, 30))) {
    markForPreservation(h1);
  }
}`;
}

/**
 * Non-preserved element hider
 */
export function getNonPreservedHider(
  preserveAttr = MARKERS.preserve,
  ancestorAttr = MARKERS.preserveAncestor,
  hideAttr = MARKERS.hide
) {
  return `
function hideNonPreservedElements(element) {
  let current = element;

  while (current && current.parentElement && current.parentElement !== document.body) {
    const parent = current.parentElement;

    Array.from(parent.children).forEach(sibling => {
      if (sibling !== current && !sibling.hasAttribute('${preserveAttr}') && !sibling.hasAttribute('${ancestorAttr}')) {
        const hasPreserved = sibling.querySelector('[${preserveAttr}], [${ancestorAttr}]');
        if (!hasPreserved) {
          sibling.setAttribute('${hideAttr}', 'true');
        }
      }
    });

    current = parent;
  }

  Array.from(document.body.children).forEach(child => {
    if (!child.hasAttribute('${preserveAttr}') &&
        !child.hasAttribute('${ancestorAttr}') &&
        !child.querySelector('[${preserveAttr}], [${ancestorAttr}]') &&
        !['SCRIPT', 'STYLE'].includes(child.tagName)) {
      child.setAttribute('${hideAttr}', 'true');
    }
  });
}`;
}

// ============================================================================
// Warning and UI Utilities
// ============================================================================

/**
 * Warning display with configurable message and styles
 */
export const WARNING_DISPLAY = `
function showWarning(message) {
  const warning = document.createElement('div');
  warning.id = '${ELEMENT_IDS.warning}';
  warning.textContent = message;
  warning.style.cssText = '${stylesToCSS(STYLE_PRESETS.warning)}';
  document.body.insertBefore(warning, document.body.firstChild);
}`;

/**
 * Generates a configurable warning display
 */
export function generateWarningDisplay(options = {}) {
  const { id = ELEMENT_IDS.warning, styles = STYLE_PRESETS.warning } = options;

  return `
function showWarning(message) {
  const warning = document.createElement('div');
  warning.id = '${id}';
  warning.textContent = message;
  warning.style.cssText = '${stylesToCSS(styles)}';
  document.body.insertBefore(warning, document.body.firstChild);
}`;
}

// ============================================================================
// Safe Element Hiding
// ============================================================================

/**
 * Safe element hiding with main content protection
 */
export const SAFE_ELEMENT_HIDER = `
function safeHideElements(selectors, options = {}) {
  const { protectMainContent = true, minTextLength = ${CONTENT_THRESHOLDS.minSubstantialText} } = options;
  const mainContent = protectMainContent
    ? document.querySelector('${getMainContentSelector()}')
    : null;

  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
          console.log('${WARNING_MESSAGES.skippingMainContent}:', selector);
          return;
        }
        if ((el.textContent?.trim().length || 0) > minTextLength) {
          console.log('${WARNING_MESSAGES.skippingSubstantialText}:', selector);
          return;
        }
        el.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {
      console.error('${WARNING_MESSAGES.invalidSelector}:', selector);
    }
  });
}`;

/**
 * Generates a configurable safe hider
 */
export function generateSafeHider(options = {}) {
  const { minTextLength = CONTENT_THRESHOLDS.minSubstantialText, mainContentSelector = getMainContentSelector() } =
    options;

  return `
function safeHide(el, selector) {
  const mainContent = document.querySelector('${mainContentSelector}');
  if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
    console.log('${WARNING_MESSAGES.skippingMainContent}:', selector);
    return false;
  }
  if ((el.textContent?.trim().length || 0) > ${minTextLength}) {
    console.log('${WARNING_MESSAGES.skippingSubstantialText}:', selector);
    return false;
  }
  el.style.setProperty('display', 'none', 'important');
  return true;
}`;
}

// ============================================================================
// Pattern Matching Utilities
// ============================================================================

/**
 * Pattern matcher for checking identifiers against regex patterns
 */
export const PATTERN_MATCHER = `
function matchesPatterns(identifier, patterns, excludePatterns = []) {
  if (!identifier || typeof identifier !== 'string') return false;
  const matchesExclude = excludePatterns.some(p => p.test(identifier));
  if (matchesExclude) return false;
  return patterns.some(p => p.test(identifier));
}`;

/**
 * Generates a pattern matcher with serialized regex
 */
export function generatePatternMatcher(patterns, excludePatterns = []) {
  const patternsStr = patterns.map((p) => p.toString()).join(',\n    ');
  const excludeStr = excludePatterns.map((p) => p.toString()).join(',\n    ');

  return `
const PATTERNS = [
    ${patternsStr}
];

const EXCLUDE_PATTERNS = [
    ${excludeStr}
];

function matchesPattern(identifier) {
  if (!identifier || typeof identifier !== 'string') return false;
  const matchesExclude = EXCLUDE_PATTERNS.some(p => p.test(identifier));
  if (matchesExclude) return false;
  return PATTERNS.some(p => p.test(identifier));
}`;
}

// ============================================================================
// DOM Manipulation Utilities
// ============================================================================

/**
 * Generates code to apply styles to elements
 */
export function generateStyleApplier(selector, styles, options = {}) {
  const { important = true, marker = null } = options;
  const styleEntries = Object.entries(styles)
    .map(([prop, value]) => {
      const cssKey = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      return important
        ? `el.style.setProperty('${cssKey}', '${value}', 'important');`
        : `el.style.${prop} = '${value}';`;
    })
    .join('\n    ');

  const markerCode = marker ? `el.setAttribute('${marker}', 'true');` : '';

  return `
document.querySelectorAll('${selector}').forEach(el => {
    ${styleEntries}
    ${markerCode}
});`;
}

/**
 * Generates code to hide elements with marker
 */
export function generateElementHider(marker = MARKERS.hide) {
  return `
function hideElement(el) {
  el.style.setProperty('display', 'none', 'important');
  el.style.setProperty('visibility', 'hidden', 'important');
  el.style.setProperty('height', '0', 'important');
  el.style.setProperty('overflow', 'hidden', 'important');
  el.setAttribute('${marker}', 'true');
}`;
}

/**
 * Generates code for collapsing empty spaces
 */
export function generateSpaceCollapse(marker) {
  return `
document.querySelectorAll('[${marker}]').forEach(el => {
  el.style.setProperty('margin', '0', 'important');
  el.style.setProperty('padding', '0', 'important');
  el.style.setProperty('border', 'none', 'important');
});`;
}

// ============================================================================
// Utility Combiners
// ============================================================================

/**
 * Combine multiple utility functions
 */
export function combineUtilities(...utilities) {
  return utilities.filter(Boolean).join('\n\n');
}

/**
 * Creates a preset set of utilities for common operations
 */
export function getContentExtractionUtilities() {
  return combineUtilities(
    CONTENT_FINDER,
    TEXT_DENSITY_FINDER,
    getMarkerUtils(),
    getTitlePreserver(),
    getNonPreservedHider(),
    WARNING_DISPLAY
  );
}

/**
 * Creates utilities for element hiding operations
 */
export function getHidingUtilities(options = {}) {
  const { marker = MARKERS.hide } = options;
  return combineUtilities(SAFE_ELEMENT_HIDER, generateElementHider(marker));
}
