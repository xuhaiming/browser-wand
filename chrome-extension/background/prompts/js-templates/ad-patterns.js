/**
 * Ad detection patterns and selectors
 * Centralized configuration for ad-related patterns
 */

/**
 * Regex patterns for identifying ads by class/ID names
 */
export const AD_PATTERNS = {
  // Strong indicators of ad elements
  strongIndicators: [
    /^ad[s]?[-_]?/i,           // ad-, ads-, ad_, ads_
    /[-_]ad[s]?$/i,            // -ad, -ads, _ad, _ads
    /[-_]ad[s]?[-_]/i,         // -ad-, -ads-, _ad_, _ads_
    /^advert/i,                // advert, advertisement
    /sponsor/i,                // sponsor, sponsored
    /^promo[-_]?/i,            // promo, promo-, promo_
    /[-_]promo$/i,             // -promo, _promo
    /outbrain/i,
    /taboola/i,
    /dfp[-_]/i,
    /gpt[-_]?ad/i,
    /googletag/i,
    /doubleclick/i,
    /adsbygoogle/i,
    /adsense/i,
    /^banner[-_]?ad/i,
    /[-_]banner[-_]?ad/i,
    /^sticky[-_]?ad/i,
    /^floating[-_]?ad/i,
    /^interstitial/i,
  ],

  // Patterns that should not be considered ads (false positives)
  excludePatterns: [
    /^add[-_]/i,               // add-button, add_item
    /[-_]add$/i,               // btn-add
    /download/i,               // download-ad (false positive)
    /upload/i,
    /gradient/i,
    /shadow/i,
    /padding/i,
    /loading/i,
    /heading/i,
    /reading/i,
    /leading/i,
    /trading/i,
    /grading/i,
    /fading/i,
    /spreading/i,
  ],
};

/**
 * Data attributes that indicate ad elements
 */
export const AD_DATA_ATTRIBUTES = [
  'data-ad',
  'data-ads',
  'data-ad-slot',
  'data-ad-unit',
  'data-ad-client',
  'data-adunit',
  'data-dfp',
  'data-google-query-id',
];

/**
 * Aria label patterns that indicate ads
 */
export const AD_ARIA_PATTERNS = [
  /advertisement/i,
  /sponsored/i,
  /^ad$/i,
];

/**
 * URL patterns for ad-serving iframes
 */
export const AD_IFRAME_PATTERNS = [
  'doubleclick',
  'googlesyndication',
  'googleadservices',
  'adserver',
  'adservice',
  'adsystem',
  'adnxs',
  'advertising',
];

/**
 * CSS selectors for common ad containers
 */
export const AD_CONTAINER_SELECTORS = [
  '.adsbygoogle',
  '[id^="google_ads"]',
  '[id^="div-gpt-ad"]',
  'ins.adsbygoogle',
  'amp-ad',
  'amp-embed[type="ad"]',
];

/**
 * Serialize patterns for use in injected scripts
 * Converts RegExp objects to their string representations
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {string} - JavaScript code declaring the patterns
 */
export function serializePatterns(patterns) {
  const serialized = patterns.map(p => p.toString());
  return serialized;
}

/**
 * Get all ad patterns as a serialized object for script injection
 * @returns {Object} - All patterns ready for JSON serialization
 */
export function getSerializedAdPatterns() {
  return {
    strongIndicators: serializePatterns(AD_PATTERNS.strongIndicators),
    excludePatterns: serializePatterns(AD_PATTERNS.excludePatterns),
    dataAttributes: AD_DATA_ATTRIBUTES,
    ariaPatterns: serializePatterns(AD_ARIA_PATTERNS),
    iframePatterns: AD_IFRAME_PATTERNS,
    containerSelectors: AD_CONTAINER_SELECTORS,
  };
}

/**
 * Generates pattern matcher code for injected scripts
 * @returns {string} - JavaScript code for pattern matching
 */
export function generatePatternMatcherCode() {
  return `
const AD_PATTERNS = {
  strongIndicators: [
    ${AD_PATTERNS.strongIndicators.map(p => p.toString()).join(',\n    ')}
  ],
  excludePatterns: [
    ${AD_PATTERNS.excludePatterns.map(p => p.toString()).join(',\n    ')}
  ]
};

const AD_DATA_ATTRS = ${JSON.stringify(AD_DATA_ATTRIBUTES)};

const AD_ARIA_PATTERNS = [
  ${AD_ARIA_PATTERNS.map(p => p.toString()).join(',\n  ')}
];

function matchesAdPattern(identifier) {
  if (!identifier || typeof identifier !== 'string') return false;
  const matchesExclude = AD_PATTERNS.excludePatterns.some(p => p.test(identifier));
  if (matchesExclude) return false;
  return AD_PATTERNS.strongIndicators.some(p => p.test(identifier));
}`.trim();
}
