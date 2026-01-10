/**
 * CSS template generators for page modification
 */

import { MARKERS } from './selectors.js';

/**
 * Generate CSS rule to hide elements marked for hiding
 */
export function hideMarkedElements() {
  return `
[${MARKERS.hide}="true"] {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide navigation elements (with preserve exclusion)
 */
export function hideNonContentElements(preserveAttr) {
  return `
header:not([${preserveAttr}]),
footer:not([${preserveAttr}]),
nav:not([${preserveAttr}]),
aside:not([${preserveAttr}]),
[role="banner"]:not([${preserveAttr}]),
[role="navigation"]:not([${preserveAttr}]),
[role="contentinfo"]:not([${preserveAttr}]) {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide sidebar elements
 */
export function hideSidebar(preserveAttr) {
  return `
[class*="sidebar"]:not([${preserveAttr}]),
[class*="side-bar"]:not([${preserveAttr}]),
[id*="sidebar"]:not([${preserveAttr}]),
[class*="Sidebar"]:not([${preserveAttr}]) {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide related content sections
 */
export function hideRelatedContent(preserveAttr) {
  return `
[class*="related"]:not([${preserveAttr}]),
[class*="Related"]:not([${preserveAttr}]),
[class*="recommend"]:not([${preserveAttr}]),
[class*="Recommend"]:not([${preserveAttr}]),
[class*="suggestion"]:not([${preserveAttr}]),
[class*="more-stories"]:not([${preserveAttr}]),
[class*="MoreStories"]:not([${preserveAttr}]),
[class*="also-read"]:not([${preserveAttr}]),
[class*="trending"]:not([${preserveAttr}]),
[class*="Trending"]:not([${preserveAttr}]),
[class*="popular"]:not([${preserveAttr}]),
[class*="Popular"]:not([${preserveAttr}]) {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide social/newsletter elements
 */
export function hideSocialElements(preserveAttr) {
  return `
[class*="share"]:not([${preserveAttr}]),
[class*="Share"]:not([${preserveAttr}]),
[class*="social"]:not([${preserveAttr}]),
[class*="Social"]:not([${preserveAttr}]),
[class*="newsletter"]:not([${preserveAttr}]),
[class*="Newsletter"]:not([${preserveAttr}]),
[class*="subscribe"]:not([${preserveAttr}]),
[class*="Subscribe"]:not([${preserveAttr}]) {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide comment sections
 */
export function hideComments(preserveAttr) {
  return `
[class*="comment"]:not([${preserveAttr}]),
[class*="Comment"]:not([${preserveAttr}]),
[id*="comment"]:not([${preserveAttr}]),
[class*="disqus"]:not([${preserveAttr}]),
[id*="disqus"]:not([${preserveAttr}]) {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide advertisements
 */
export function hideAds(preserveAttr) {
  return `
[class*="ad-"]:not([${preserveAttr}]),
[class*="ads-"]:not([${preserveAttr}]),
[class*="advert"]:not([${preserveAttr}]),
[class*="Advert"]:not([${preserveAttr}]),
[class*="sponsor"]:not([${preserveAttr}]),
[class*="Sponsor"]:not([${preserveAttr}]),
[class*="promo"]:not([${preserveAttr}]),
[class*="Promo"]:not([${preserveAttr}]),
[class*="banner"]:not([${preserveAttr}]):not(h1):not(h2):not(h3),
[id*="ad-"]:not([${preserveAttr}]),
[id*="ads-"]:not([${preserveAttr}]),
.adsbygoogle,
[data-ad],
[data-ad-slot],
iframe[src*="ad"],
iframe[src*="doubleclick"],
iframe[src*="googlesyndication"] {
  display: none !important;
}`;
}

/**
 * Generate CSS to hide miscellaneous non-content elements
 */
export function hideMiscElements(preserveAttr) {
  return `
[class*="outbrain"]:not([${preserveAttr}]),
[class*="taboola"]:not([${preserveAttr}]),
[class*="widget"]:not([${preserveAttr}]),
[class*="Widget"]:not([${preserveAttr}]),
[class*="breaking"]:not([${preserveAttr}]),
[class*="Breaking"]:not([${preserveAttr}]),
[class*="ticker"]:not([${preserveAttr}]),
[class*="Ticker"]:not([${preserveAttr}]),
[class*="popup"]:not([${preserveAttr}]),
[class*="Popup"]:not([${preserveAttr}]),
[class*="modal"]:not([${preserveAttr}]),
[class*="Modal"]:not([${preserveAttr}]),
[class*="overlay"]:not([${preserveAttr}]):not(video),
[class*="Overlay"]:not([${preserveAttr}]):not(video) {
  display: none !important;
}`;
}

/**
 * Reader mode styles for preserved content
 */
export const READER_MODE_STYLES = `
[${MARKERS.preserve}] {
  display: block !important;
  visibility: visible !important;
  max-width: 800px !important;
  margin: 40px auto !important;
  padding: 20px 40px !important;
  background: #fff !important;
  color: #333 !important;
  font-size: 18px !important;
  line-height: 1.7 !important;
  font-family: Georgia, 'Times New Roman', serif !important;
}

[${MARKERS.preserve}] img {
  max-width: 100% !important;
  height: auto !important;
}

[${MARKERS.preserve}] h1,
[${MARKERS.preserve}] h2,
[${MARKERS.preserve}] h3 {
  line-height: 1.3 !important;
  margin-top: 1.5em !important;
}

[${MARKERS.preserveAncestor}] {
  display: block !important;
  visibility: visible !important;
  max-width: none !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
}

body {
  background: #f5f5f5 !important;
}`;

/**
 * Generate complete hiding CSS with preserve exclusions
 */
export function generateHidingCSS() {
  const preserveAttr = `${MARKERS.preserve}], [${MARKERS.preserveAncestor}`;
  return [
    hideMarkedElements(),
    hideNonContentElements(preserveAttr),
    hideSidebar(preserveAttr),
    hideRelatedContent(preserveAttr),
    hideSocialElements(preserveAttr),
    hideComments(preserveAttr),
    hideAds(preserveAttr),
    hideMiscElements(preserveAttr),
    READER_MODE_STYLES,
  ].join('\n');
}

/**
 * CSS for ad removal
 */
export const AD_REMOVAL_CSS = `
/* Google AdSense */
.adsbygoogle,
ins.adsbygoogle,
[id^="google_ads"],
[id^="div-gpt-ad"],
[class*="GoogleActiveViewElement"] {
  display: none !important;
}

/* Common ad networks */
[class*="outbrain"],
[class*="taboola"],
[id*="outbrain"],
[id*="taboola"],
.OUTBRAIN,
.taboola-widget {
  display: none !important;
}

/* Data attribute based ads */
[data-ad],
[data-ads],
[data-ad-slot],
[data-ad-unit],
[data-ad-client],
[data-adunit],
[data-dfp],
[data-google-query-id] {
  display: none !important;
}

/* Iframe ads */
iframe[src*="doubleclick"],
iframe[src*="googlesyndication"],
iframe[src*="googleadservices"],
iframe[src*="adserver"],
iframe[src*="adservice"],
iframe[src*="advertising"],
iframe[id*="google_ads"] {
  display: none !important;
}

/* AMP ads */
amp-ad,
amp-embed[type="ad"],
amp-sticky-ad {
  display: none !important;
}

/* Sticky/floating ads */
[class*="sticky"][class*="ad"],
[class*="fixed"][class*="ad"],
[class*="floating"][class*="ad"],
[class*="stickyAd"],
[class*="fixedAd"],
[class*="floatingAd"] {
  display: none !important;
  position: static !important;
}

/* Interstitials and overlays */
[class*="interstitial"],
[class*="Interstitial"],
[id*="interstitial"],
[class*="ad-overlay"],
[class*="adOverlay"] {
  display: none !important;
}

/* Sponsored content markers */
[class*="sponsored"],
[class*="Sponsored"],
[data-sponsored],
[aria-label*="Sponsored"],
[aria-label*="sponsored"] {
  display: none !important;
}`;

/**
 * CSS for bilingual/translation layout
 */
export const TRANSLATION_CSS = `
/* Container for bilingual content */
.bw-bilingual-container {
  display: flex !important;
  gap: 20px !important;
  margin: 16px 0 !important;
  padding: 16px !important;
  background: #f9f9f9 !important;
  border-radius: 8px !important;
  border-left: 4px solid #007bff !important;
}

.bw-original-text {
  flex: 1 !important;
  padding-right: 16px !important;
  border-right: 1px solid #e0e0e0 !important;
}

.bw-translated-text {
  flex: 1 !important;
  padding-left: 16px !important;
  color: #333 !important;
  font-style: italic !important;
}

.bw-translation-label {
  font-size: 12px !important;
  color: #666 !important;
  margin-bottom: 8px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
}

/* Heading translations */
.bw-heading-translation {
  display: block !important;
  font-size: 0.8em !important;
  color: #666 !important;
  font-style: italic !important;
  margin-top: 4px !important;
  font-weight: normal !important;
}

/* Inline translations for shorter text */
.bw-inline-translation {
  display: inline !important;
  color: #666 !important;
  font-style: italic !important;
  margin-left: 8px !important;
}

.bw-inline-translation::before {
  content: "(" !important;
}

.bw-inline-translation::after {
  content: ")" !important;
}

/* Toggle button for translations */
.bw-translation-toggle {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  padding: 10px 20px !important;
  background: #007bff !important;
  color: white !important;
  border: none !important;
  border-radius: 20px !important;
  cursor: pointer !important;
  z-index: 999999 !important;
  font-size: 14px !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
}

.bw-translation-toggle:hover {
  background: #0056b3 !important;
}`;

/**
 * CSS for comment removal
 */
export function generateCommentRemovalCSS(additionalSelectors = []) {
  const baseSelectors = [
    '[class*="comment"]',
    '[class*="Comment"]',
    '[id*="comment"]',
    '[class*="disqus"]',
    '[id*="disqus"]',
    '#disqus_thread',
    '[class*="discussion"]',
    '[id*="discussion"]',
    '[class*="reply"]:not(button):not(a)',
    '[class*="replies"]',
    '.comments-section',
    '.comment-thread',
    '.user-comments',
    '[data-component="comments"]',
    '[data-testid*="comment"]',
  ];

  return [...baseSelectors, ...additionalSelectors].join(',\n') + ` {
  display: none !important;
}`;
}
