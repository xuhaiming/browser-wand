/**
 * Ad removal script generator
 */

import { MARKERS } from '../../selectors.js';
import { ScriptBuilder, createObserverCode, delayedExecution } from '../script-builder.js';
import { CONTENT_THRESHOLDS, mergeConfig } from '../config.js';
import {
  AD_PATTERNS,
  AD_DATA_ATTRIBUTES,
  AD_ARIA_PATTERNS,
  AD_IFRAME_PATTERNS,
  AD_CONTAINER_SELECTORS,
  generatePatternMatcherCode,
} from '../ad-patterns.js';
import { generateSpaceCollapse } from '../dom-utils.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  maxTextLengthForAd: CONTENT_THRESHOLDS.minSubstantialText,
  cleanupDelay: 500,
  hiddenMarker: MARKERS.adHidden,
};

/**
 * Generates the ad detection logic
 */
function getAdDetectionCode() {
  const iframePatterns = AD_IFRAME_PATTERNS.join('|');

  return `
function isLikelyAd(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el === document.body || el === document.documentElement) return false;

  if (el.tagName === 'IFRAME') {
    const src = el.src || '';
    if (/${iframePatterns}/i.test(src)) {
      return true;
    }
  }

  const className = el.className;
  if (typeof className === 'string' && className) {
    const classes = className.split(/\\s+/);
    if (classes.some(c => matchesAdPattern(c))) return true;
  }

  if (el.id && matchesAdPattern(el.id)) return true;

  for (const attr of AD_DATA_ATTRS) {
    if (el.hasAttribute(attr)) return true;
  }

  const ariaLabel = el.getAttribute('aria-label') || '';
  if (AD_ARIA_PATTERNS.some(p => p.test(ariaLabel))) return true;

  if (el.classList && el.classList.contains('adsbygoogle')) return true;

  return false;
}`;
}

/**
 * Generates content protection logic
 */
function getContentProtectionCode(config) {
  return `
function containsMainContent(el) {
  const textLength = (el.textContent || '').trim().length;
  if (textLength > ${config.maxTextLengthForAd}) {
    const identifier = (el.className || '') + (el.id || '');
    if (matchesAdPattern(identifier)) return false;
    return true;
  }
  return false;
}`;
}

/**
 * Generates the ad hiding logic
 */
function getHideAdCode(marker) {
  return `
function hideAd(el) {
  if (containsMainContent(el)) return;
  el.style.setProperty('display', 'none', 'important');
  el.style.setProperty('visibility', 'hidden', 'important');
  el.style.setProperty('height', '0', 'important');
  el.style.setProperty('overflow', 'hidden', 'important');
  el.setAttribute('${marker}', 'true');
}`;
}

/**
 * Generates the ad processing logic
 */
function getProcessAdsCode(marker) {
  return `
function processAds() {
  const allElements = document.querySelectorAll('*');
  let hiddenCount = 0;

  allElements.forEach(el => {
    if (el.hasAttribute('${marker}')) return;
    if (isLikelyAd(el)) {
      hideAd(el);
      hiddenCount++;
    }
  });

  COMMON_AD_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.hasAttribute('${marker}')) {
          hideAd(el);
          hiddenCount++;
        }
      });
    } catch(e) {}
  });

  return hiddenCount;
}`;
}

/**
 * Generates the mutation observer callback
 */
function getObserverCallback(marker) {
  return `
function handleMutations(mutations) {
  let newAds = 0;
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (isLikelyAd(node)) {
          hideAd(node);
          newAds++;
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('*').forEach(child => {
            if (isLikelyAd(child) && !child.hasAttribute('${marker}')) {
              hideAd(child);
              newAds++;
            }
          });
        }
      }
    });
  });
  if (newAds > 0) {
    console.log('[Browser Wand] Hidden', newAds, 'dynamically loaded ad elements');
  }
}`;
}

/**
 * Generates the complete ad removal script
 */
export function generateAdRemovalScript(options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const { hiddenMarker, cleanupDelay } = config;

  const mainExecution = `
const initialCount = processAds();
console.log('[Browser Wand] Initially hidden', initialCount, 'ad elements');

${createObserverCode('handleMutations')}

${delayedExecution(generateSpaceCollapse(hiddenMarker), cleanupDelay)}`;

  return ScriptBuilder.create()
    .useStrict()
    .constant('AD_DATA_ATTRS', AD_DATA_ATTRIBUTES)
    .constant('COMMON_AD_SELECTORS', AD_CONTAINER_SELECTORS)
    .rawConstant('AD_ARIA_PATTERNS', `[${AD_ARIA_PATTERNS.map((p) => p.toString()).join(', ')}]`)
    .sections(
      generatePatternMatcherCode(),
      getAdDetectionCode(),
      getContentProtectionCode(config),
      getHideAdCode(hiddenMarker),
      getProcessAdsCode(hiddenMarker),
      getObserverCallback(hiddenMarker),
      mainExecution
    )
    .build();
}

/**
 * Generates a lightweight ad blocker for specific selectors
 */
export function generateSelectiveAdRemoval(additionalSelectors = [], options = {}) {
  const { observe = false } = options;
  const allSelectors = [...AD_CONTAINER_SELECTORS, ...additionalSelectors];

  const hideCode = `
selectors.forEach(selector => {
  try {
    document.querySelectorAll(selector).forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
  } catch (e) {
    console.warn('Browser Wand: Invalid selector:', selector);
  }
});

console.log('[Browser Wand] Selectively hidden ad elements');`;

  const observerCode = observe
    ? `
function handleMutations() {
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {}
  });
}

${createObserverCode('handleMutations')}`
    : '';

  return ScriptBuilder.create()
    .constant('selectors', allSelectors)
    .sections(hideCode, observerCode)
    .build();
}

/**
 * Generates a configurable ad detector with custom patterns
 */
export function generateConfigurableAdRemoval(customConfig = {}) {
  const {
    additionalPatterns = [],
    additionalExcludePatterns = [],
    additionalSelectors = [],
    maxTextLength = DEFAULT_CONFIG.maxTextLengthForAd,
  } = customConfig;

  const allPatterns = [...AD_PATTERNS.strongIndicators, ...additionalPatterns];
  const allExclude = [...AD_PATTERNS.excludePatterns, ...additionalExcludePatterns];
  const allSelectors = [...AD_CONTAINER_SELECTORS, ...additionalSelectors];

  const patternsCode = `
const AD_PATTERNS = {
  strongIndicators: [${allPatterns.map((p) => p.toString()).join(',\n    ')}],
  excludePatterns: [${allExclude.map((p) => p.toString()).join(',\n    ')}]
};

function matchesAdPattern(identifier) {
  if (!identifier || typeof identifier !== 'string') return false;
  const matchesExclude = AD_PATTERNS.excludePatterns.some(p => p.test(identifier));
  if (matchesExclude) return false;
  return AD_PATTERNS.strongIndicators.some(p => p.test(identifier));
}`;

  const config = mergeConfig(DEFAULT_CONFIG, { maxTextLengthForAd: maxTextLength });
  const { hiddenMarker, cleanupDelay } = config;

  return ScriptBuilder.create()
    .useStrict()
    .constant('AD_DATA_ATTRS', AD_DATA_ATTRIBUTES)
    .constant('COMMON_AD_SELECTORS', allSelectors)
    .rawConstant('AD_ARIA_PATTERNS', `[${AD_ARIA_PATTERNS.map((p) => p.toString()).join(', ')}]`)
    .sections(
      patternsCode,
      getAdDetectionCode(),
      getContentProtectionCode(config),
      getHideAdCode(hiddenMarker),
      getProcessAdsCode(hiddenMarker),
      getObserverCallback(hiddenMarker),
      `
const initialCount = processAds();
console.log('[Browser Wand] Initially hidden', initialCount, 'ad elements');

${createObserverCode('handleMutations')}

${delayedExecution(generateSpaceCollapse(hiddenMarker), cleanupDelay)}`
    )
    .build();
}
