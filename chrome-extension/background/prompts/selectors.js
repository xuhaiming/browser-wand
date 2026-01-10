/**
 * CSS Selector configurations for page modification
 * Organized by category with reliability ordering
 */

// Content selectors ordered by reliability (most specific first)
export const CONTENT_SELECTORS = {
  // Schema.org and semantic markup (most reliable)
  schemaOrg: [
    '[itemprop="articleBody"]',
    '[itemtype*="Article"]',
  ],

  // Data attributes (modern frameworks)
  dataAttributes: [
    '[data-testid*="article-body"]',
    '[data-testid*="article-content"]',
    '[data-component*="article-body"]',
    '[data-content-type="article"]',
  ],

  // Semantic class patterns
  articleClasses: [
    '.article-body',
    '.article-content',
    '.article__body',
    '.article__content',
    '.story-body',
    '.story-content',
    '.story__body',
    '.story__content',
    '.post-content',
    '.post-body',
    '.entry-content',
    '.content-body',
    '.news-content',
    '.news-body',
  ],

  // ID-based selectors
  articleIds: [
    '#article-body',
    '#article-content',
    '#story-body',
    '#story-content',
  ],

  // Attribute-contains for camelCase/various naming patterns
  attributePatterns: [
    '[class*="ArticleBody"]',
    '[class*="StoryBody"]',
    '[class*="ArticleContent"]',
    '[class*="article-body"]',
    '[class*="article-content"]',
    '[class*="story-body"]',
    '[class*="story-content"]',
  ],

  // Article elements with content-related classes
  articleElements: [
    'article[class*="content"]',
    'article[class*="body"]',
    'article[class*="story"]',
    'article[class*="post"]',
  ],

  // Generic semantic elements (fallback)
  semantic: [
    'article',
    'main [role="article"]',
    '[role="article"]',
    'main article',
    'main',
    '[role="main"]',
    '#main-content',
    '#content',
    '.main-content',
  ],
};

// Non-content elements to hide
export const NON_CONTENT_SELECTORS = {
  navigation: [
    'header',
    'footer',
    'nav',
    'aside',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="contentinfo"]',
  ],

  sidebar: [
    '[class*="sidebar"]',
    '[class*="side-bar"]',
    '[id*="sidebar"]',
    '[class*="Sidebar"]',
  ],

  related: [
    '[class*="related"]',
    '[class*="Related"]',
    '[class*="recommend"]',
    '[class*="Recommend"]',
    '[class*="suggestion"]',
    '[class*="more-stories"]',
    '[class*="also-read"]',
  ],

  trending: [
    '[class*="trending"]',
    '[class*="Trending"]',
    '[class*="popular"]',
    '[class*="Popular"]',
  ],

  social: [
    '[class*="share"]',
    '[class*="Share"]',
    '[class*="social"]',
    '[class*="Social"]',
  ],

  newsletter: [
    '[class*="newsletter"]',
    '[class*="Newsletter"]',
    '[class*="subscribe"]',
    '[class*="Subscribe"]',
  ],

  comments: [
    '[class*="comment"]',
    '[class*="Comment"]',
    '[id*="comment"]',
    '[class*="disqus"]',
    '[id*="disqus"]',
    '#disqus_thread',
  ],

  ads: [
    // Google AdSense
    '.adsbygoogle',
    'ins.adsbygoogle',
    '[id^="google_ads"]',
    '[id^="div-gpt-ad"]',
    // Data attributes
    '[data-ad]',
    '[data-ads]',
    '[data-ad-slot]',
    '[data-ad-unit]',
    '[data-ad-client]',
    '[data-adunit]',
    '[data-dfp]',
    '[data-google-query-id]',
    // Class patterns
    '[class^="ad-"]',
    '[class^="ads-"]',
    '[class*=" ad-"]',
    '[class*=" ads-"]',
    '[class$="-ad"]',
    '[class$="-ads"]',
    '[class*="-ad "]',
    '[class*="-ads "]',
    '[class*="advert"]',
    '[class*="Advert"]',
    // ID patterns
    '[id^="ad-"]',
    '[id^="ads-"]',
    '[id*="-ad-"]',
    '[id*="-ads-"]',
    '[id$="-ad"]',
    '[id$="-ads"]',
    // Iframes
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="googleadservices"]',
    'iframe[src*="adserver"]',
    'iframe[src*="adservice"]',
    'iframe[id*="google_ads"]',
    // AMP ads
    'amp-ad',
    'amp-embed[type="ad"]',
    'amp-sticky-ad',
    // Aria labels
    '[aria-label*="advertisement"]',
    '[aria-label*="Advertisement"]',
    '[aria-label*="sponsored"]',
    '[aria-label*="Sponsored"]',
    // DFP/GPT
    '[class*="dfp"]',
    '[class*="gpt-ad"]',
    '[class*="GoogleActiveViewElement"]',
  ],

  sponsored: [
    '[class*="sponsor"]',
    '[class*="Sponsor"]',
    '[class*="promo"]',
    '[class*="Promo"]',
  ],

  thirdParty: [
    '[class*="outbrain"]',
    '[class*="taboola"]',
  ],

  widgets: [
    '[class*="widget"]',
    '[class*="Widget"]',
    '[class*="ticker"]',
    '[class*="Ticker"]',
  ],

  overlays: [
    '[class*="popup"]',
    '[class*="Popup"]',
    '[class*="modal"]',
    '[class*="Modal"]',
    '[class*="overlay"]:not(video)',
    '[class*="Overlay"]:not(video)',
  ],
};

// Exclusion patterns for content detection
export const EXCLUSION_PATTERNS = [
  'comment',
  'sidebar',
  'footer',
  'header',
  'nav',
  'menu',
  'ad-',
  'related',
];

// Data attribute markers used by Browser Wand
export const MARKERS = {
  preserve: 'data-bw-preserve',
  preserveAncestor: 'data-bw-preserve-ancestor',
  hide: 'data-bw-hide',
  adHidden: 'data-bw-ad-hidden',
  translated: 'data-bw-translated',
};

/**
 * Get all content selectors as a flat array
 */
export function getAllContentSelectors() {
  return Object.values(CONTENT_SELECTORS).flat();
}

/**
 * Format selector array as JSON string for embedding in prompts
 */
export function formatSelectorsForPrompt(selectors) {
  return JSON.stringify(selectors, null, 2);
}
