/**
 * Content extraction script generator for reader mode
 */

import { getAllContentSelectors, EXCLUSION_PATTERNS, MARKERS } from '../../selectors.js';
import { generateHidingCSS } from '../../css-templates.js';
import { ScriptBuilder, injectStyleCode, createLog } from '../script-builder.js';
import {
  CONTENT_THRESHOLDS,
  ELEMENT_IDS,
  WARNING_MESSAGES,
  mergeConfig,
} from '../config.js';
import {
  CONTENT_FINDER,
  TEXT_DENSITY_FINDER,
  WARNING_DISPLAY,
  getMarkerUtils,
  getTitlePreserver,
  getNonPreservedHider,
  combineUtilities,
} from '../dom-utils.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  minContentLength: CONTENT_THRESHOLDS.minContentLength,
  minFallbackLength: CONTENT_THRESHOLDS.minFallbackLength,
  warningMessage: WARNING_MESSAGES.noContent,
  styleId: ELEMENT_IDS.readerStyle,
};

/**
 * Generates the main execution code
 */
function getMainExecutionCode(config) {
  return `
const result = findMainContent(CONTENT_SELECTORS, ${config.minContentLength}) || findByTextDensity(EXCLUSION_PATTERNS, ${config.minFallbackLength});

if (!result) {
  console.warn('Browser Wand: Could not find main content.');
  showWarning('${config.warningMessage}');
  return;
}

${createLog('Found content using: " + result.selector + "')}

markForPreservation(result.element);
preserveTitle(result.element);
hideNonPreservedElements(result.element);`;
}

/**
 * Generates the content extraction script for reader mode
 */
export function generateContentExtractionScript(options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const domUtilities = combineUtilities(
    CONTENT_FINDER,
    TEXT_DENSITY_FINDER,
    getMarkerUtils(MARKERS.preserve, MARKERS.preserveAncestor),
    getTitlePreserver(MARKERS.preserve, MARKERS.preserveAncestor),
    getNonPreservedHider(MARKERS.preserve, MARKERS.preserveAncestor, MARKERS.hide),
    WARNING_DISPLAY
  );

  const styleInjection = injectStyleCode(generateHidingCSS(), config.styleId);

  return ScriptBuilder.create()
    .constants({
      CONTENT_SELECTORS: getAllContentSelectors(),
      EXCLUSION_PATTERNS,
    })
    .sections(domUtilities, getMainExecutionCode(config), styleInjection)
    .build();
}

/**
 * Creates a simplified content extraction script for specific selectors
 */
export function generateSimpleContentExtraction(selectors, options = {}) {
  const { minLength = 200 } = options;

  const code = `
const selectors = ${JSON.stringify(selectors)};
let mainContent = null;

for (const selector of selectors) {
  try {
    mainContent = document.querySelector(selector);
    if (mainContent && mainContent.textContent.trim().length > ${minLength}) break;
  } catch (e) {}
}

if (!mainContent) {
  console.warn('Browser Wand: No content found with provided selectors');
  return null;
}

return {
  element: mainContent,
  text: mainContent.textContent.trim(),
  html: mainContent.innerHTML
};`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Creates a content extraction script that returns extracted content
 * instead of modifying the page
 */
export function generateContentRetrieval(selectors, options = {}) {
  const { minLength = CONTENT_THRESHOLDS.minContentLength, includeMetadata = false } = options;

  const metadataCode = includeMetadata
    ? `
const title = document.querySelector('h1')?.textContent?.trim() || document.title;
const author = document.querySelector('[rel="author"], [itemprop="author"], .author')?.textContent?.trim();
const date = document.querySelector('[datetime], [itemprop="datePublished"], time')?.getAttribute('datetime') ||
             document.querySelector('[datetime], [itemprop="datePublished"], time')?.textContent?.trim();`
    : '';

  const returnObj = includeMetadata
    ? `{ content: content.textContent.trim(), html: content.innerHTML, title, author, date }`
    : `{ content: content.textContent.trim(), html: content.innerHTML }`;

  const code = `
const selectors = ${JSON.stringify(selectors)};
${metadataCode}

for (const selector of selectors) {
  try {
    const content = document.querySelector(selector);
    if (content && content.textContent.trim().length > ${minLength}) {
      return ${returnObj};
    }
  } catch (e) {}
}

return null;`;

  return ScriptBuilder.create().section(code).build();
}
