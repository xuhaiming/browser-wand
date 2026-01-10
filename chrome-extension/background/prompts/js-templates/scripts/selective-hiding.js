/**
 * Selective element hiding script generator
 */

import { ScriptBuilder } from '../script-builder.js';
import {
  CONTENT_THRESHOLDS,
  ELEMENT_SELECTORS,
  WARNING_MESSAGES,
  getMainContentSelector,
  mergeConfig,
} from '../config.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  minTextLengthToProtect: CONTENT_THRESHOLDS.minSubstantialText,
  protectMainContent: true,
};

/**
 * Generates safe hiding function
 */
function getSafeHidingFunction(config) {
  const mainContentSelector = getMainContentSelector();

  return `
const mainContent = ${config.protectMainContent}
  ? document.querySelector('${mainContentSelector}')
  : null;

function safeHide(el, selector) {
  if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
    console.log('${WARNING_MESSAGES.skippingMainContent}:', selector);
    return false;
  }
  if ((el.textContent?.trim().length || 0) > ${config.minTextLengthToProtect}) {
    console.log('${WARNING_MESSAGES.skippingSubstantialText}:', selector);
    return false;
  }
  el.style.setProperty('display', 'none', 'important');
  return true;
}`;
}

/**
 * Generates a selective hiding script
 */
export function generateSelectiveHidingScript(selectors, options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const hideCode = `
selectorsToHide.forEach(selector => {
  try {
    document.querySelectorAll(selector).forEach(el => {
      safeHide(el, selector);
    });
  } catch (e) {
    console.error('${WARNING_MESSAGES.invalidSelector}:', selector);
  }
});

console.log('[Browser Wand] Selectively hidden', selectorsToHide.length, 'element types');`;

  return ScriptBuilder.create()
    .constant('selectorsToHide', selectors)
    .sections(getSafeHidingFunction(config), hideCode)
    .build();
}

/**
 * Generates a script to hide elements by various criteria
 */
export function generateCriteriaBasedHiding(criteria, options = {}) {
  const { classPatterns = [], idPatterns = [], selectors = [] } = criteria;
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const mainContentSelector = getMainContentSelector();

  const code = `
const classPatterns = ${JSON.stringify(classPatterns)};
const idPatterns = ${JSON.stringify(idPatterns)};
const directSelectors = ${JSON.stringify(selectors)};

const mainContent = document.querySelector('${mainContentSelector}');

function shouldHide(el) {
  if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
    return false;
  }

  const className = el.className || '';
  if (typeof className === 'string') {
    for (const pattern of classPatterns) {
      if (className.toLowerCase().includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  const id = el.id || '';
  for (const pattern of idPatterns) {
    if (id.toLowerCase().includes(pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

let hiddenCount = 0;
document.querySelectorAll('*').forEach(el => {
  if (shouldHide(el)) {
    el.style.setProperty('display', 'none', 'important');
    hiddenCount++;
  }
});

directSelectors.forEach(selector => {
  try {
    document.querySelectorAll(selector).forEach(el => {
      if (!mainContent || (!el.contains(mainContent) && !mainContent.contains(el))) {
        el.style.setProperty('display', 'none', 'important');
        hiddenCount++;
      }
    });
  } catch (e) {}
});

console.log('[Browser Wand] Hidden', hiddenCount, 'elements based on criteria');`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a script to hide elements matching regex patterns
 */
export function generateRegexBasedHiding(patterns, options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const mainContentSelector = getMainContentSelector();

  const patternsStr = patterns.map((p) => (p instanceof RegExp ? p.toString() : `/${p}/i`)).join(',\n  ');

  const code = `
const patterns = [
  ${patternsStr}
];

const mainContent = document.querySelector('${mainContentSelector}');

function matchesPatterns(identifier) {
  if (!identifier) return false;
  return patterns.some(p => p.test(identifier));
}

let hiddenCount = 0;
document.querySelectorAll('*').forEach(el => {
  if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
    return;
  }

  const identifier = (el.className || '') + ' ' + (el.id || '');
  if (matchesPatterns(identifier)) {
    el.style.setProperty('display', 'none', 'important');
    hiddenCount++;
  }
});

console.log('[Browser Wand] Hidden', hiddenCount, 'elements matching patterns');`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Template for user-customizable hiding script
 * Used when LLM generates specific selectors
 */
export const SELECTIVE_HIDING_TEMPLATE = `
(function() {
  const selectorsToHide = [
    // Add specific selectors based on user request
  ];

  const mainContent = document.querySelector('${getMainContentSelector()}');

  selectorsToHide.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
          console.log('${WARNING_MESSAGES.skippingMainContent}:', selector);
          return;
        }
        if ((el.textContent?.trim().length || 0) > ${DEFAULT_CONFIG.minTextLengthToProtect}) {
          console.log('${WARNING_MESSAGES.skippingSubstantialText}:', selector);
          return;
        }
        el.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {
      console.error('${WARNING_MESSAGES.invalidSelector}:', selector);
    }
  });
})();`;
