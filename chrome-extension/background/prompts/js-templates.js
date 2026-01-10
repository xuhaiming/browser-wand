/**
 * JavaScript code templates for page modification
 */

import {
  getAllContentSelectors,
  formatSelectorsForPrompt,
  EXCLUSION_PATTERNS,
  MARKERS,
} from './selectors.js';
import { generateHidingCSS } from './css-templates.js';

/**
 * Content extraction script template for reader mode
 */
export function getContentExtractionScript() {
  return `
(function() {
  const CONTENT_SELECTORS = ${formatSelectorsForPrompt(getAllContentSelectors())};

  const EXCLUSION_PATTERNS = ${formatSelectorsForPrompt(EXCLUSION_PATTERNS)};

  const MIN_CONTENT_LENGTH = 300;
  const MIN_FALLBACK_LENGTH = 500;

  // Find main content using selector priorities
  function findMainContent() {
    for (const selector of CONTENT_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el && (el.textContent || '').trim().length > MIN_CONTENT_LENGTH) {
          return { element: el, selector };
        }
      } catch (e) { /* Invalid selector */ }
    }
    return null;
  }

  // Fallback: find element with highest text density
  function findByTextDensity() {
    const candidates = document.querySelectorAll('div, section, article');
    let best = { element: null, score: 0 };

    candidates.forEach(el => {
      const text = (el.textContent || '').trim();
      const childCount = el.querySelectorAll('*').length || 1;
      const score = text.length / Math.sqrt(childCount);

      if (text.length > MIN_FALLBACK_LENGTH && score > best.score) {
        const identifier = ((el.className || '') + (el.id || '')).toLowerCase();
        const isExcluded = EXCLUSION_PATTERNS.some(p => identifier.includes(p));

        if (!isExcluded) {
          best = { element: el, score };
        }
      }
    });

    return best.element ? { element: best.element, selector: 'fallback-density' } : null;
  }

  // Mark element and ancestors for preservation
  function markForPreservation(element) {
    element.setAttribute('${MARKERS.preserve}', 'true');
    element.id = element.id || 'browser-wand-main-content';

    let ancestor = element.parentElement;
    while (ancestor && ancestor !== document.body) {
      ancestor.setAttribute('${MARKERS.preserveAncestor}', 'true');
      ancestor = ancestor.parentElement;
    }
  }

  // Preserve title if outside content area
  function preserveTitle(mainContent) {
    const h1 = document.querySelector('h1');
    if (!h1 || mainContent.contains(h1)) return;

    const h1Text = h1.textContent.trim().toLowerCase();
    const pageTitle = document.title.toLowerCase();

    if (pageTitle.includes(h1Text.substring(0, 30)) || h1Text.includes(pageTitle.substring(0, 30))) {
      markForPreservation(h1);
    }
  }

  // Hide siblings not in preserve chain
  function hideNonPreservedElements(element) {
    let current = element;

    while (current && current.parentElement && current.parentElement !== document.body) {
      const parent = current.parentElement;

      Array.from(parent.children).forEach(sibling => {
        if (sibling !== current && !sibling.hasAttribute('${MARKERS.preserve}') && !sibling.hasAttribute('${MARKERS.preserveAncestor}')) {
          const hasPreserved = sibling.querySelector('[${MARKERS.preserve}], [${MARKERS.preserveAncestor}]');
          if (!hasPreserved) {
            sibling.setAttribute('${MARKERS.hide}', 'true');
          }
        }
      });

      current = parent;
    }

    // Hide body direct children not in preserve chain
    Array.from(document.body.children).forEach(child => {
      if (!child.hasAttribute('${MARKERS.preserve}') &&
          !child.hasAttribute('${MARKERS.preserveAncestor}') &&
          !child.querySelector('[${MARKERS.preserve}], [${MARKERS.preserveAncestor}]') &&
          !['SCRIPT', 'STYLE'].includes(child.tagName)) {
        child.setAttribute('${MARKERS.hide}', 'true');
      }
    });
  }

  // Show warning when content not found
  function showWarning() {
    const warning = document.createElement('div');
    warning.id = 'browser-wand-warning';
    warning.textContent = 'Browser Wand: Could not detect main article content. Please try a more specific request.';
    warning.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fff3cd;color:#856404;padding:10px;text-align:center;z-index:999999;font-size:14px;';
    document.body.insertBefore(warning, document.body.firstChild);
  }

  // Main execution
  const result = findMainContent() || findByTextDensity();

  if (!result) {
    console.warn('Browser Wand: Could not find main content.');
    showWarning();
    return;
  }

  console.log('Browser Wand: Found content using:', result.selector);

  markForPreservation(result.element);
  preserveTitle(result.element);
  hideNonPreservedElements(result.element);

  // Inject hiding styles
  const style = document.createElement('style');
  style.id = 'browser-wand-reader-style';
  style.textContent = \`${generateHidingCSS()}\`;
  document.head.appendChild(style);
})();`;
}

/**
 * Selective element hiding script template
 */
export const SELECTIVE_HIDING_SCRIPT = `
(function() {
  const selectorsToHide = [
    // Add specific selectors based on user request
  ];

  const mainContent = document.querySelector('article, main, [role="main"], [itemprop="articleBody"]');

  selectorsToHide.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        // Safety: don't hide main content containers
        if (mainContent && (el.contains(mainContent) || mainContent.contains(el))) {
          console.log('Browser Wand: Skipping to protect main content:', selector);
          return;
        }
        // Safety: don't hide elements with substantial text
        if ((el.textContent?.trim().length || 0) > 1000) {
          console.log('Browser Wand: Skipping element with substantial text:', selector);
          return;
        }
        el.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {
      console.error('Browser Wand: Invalid selector:', selector);
    }
  });
})();`;

/**
 * Ad removal script template
 */
export const AD_REMOVAL_SCRIPT = `
(function() {
  'use strict';

  // Comprehensive list of ad-related patterns
  const AD_PATTERNS = {
    // Class/ID patterns that strongly indicate ads
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
    // Patterns to exclude (false positives)
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
    ]
  };

  // Data attributes that indicate ads
  const AD_DATA_ATTRS = ['data-ad', 'data-ads', 'data-ad-slot', 'data-ad-unit', 'data-ad-client', 'data-adunit', 'data-dfp', 'data-google-query-id'];

  // Aria labels that indicate ads
  const AD_ARIA_PATTERNS = [/advertisement/i, /sponsored/i, /^ad$/i];

  // Check if element identifier matches ad patterns but not exclude patterns
  function matchesAdPattern(identifier) {
    if (!identifier || typeof identifier !== 'string') return false;
    const matchesExclude = AD_PATTERNS.excludePatterns.some(p => p.test(identifier));
    if (matchesExclude) return false;
    return AD_PATTERNS.strongIndicators.some(p => p.test(identifier));
  }

  // Check if element is likely an ad
  function isLikelyAd(el) {
    if (!el || el.nodeType !== 1) return false;

    // Skip if it's the body or html
    if (el === document.body || el === document.documentElement) return false;

    // Check tag name for iframes with ad sources
    if (el.tagName === 'IFRAME') {
      const src = el.src || '';
      if (/doubleclick|googlesyndication|googleadservices|adserver|adservice|adsystem|adnxs|advertising/i.test(src)) {
        return true;
      }
    }

    // Check class names
    const className = el.className;
    if (typeof className === 'string' && className) {
      const classes = className.split(/\\s+/);
      if (classes.some(c => matchesAdPattern(c))) return true;
    }

    // Check ID
    if (el.id && matchesAdPattern(el.id)) return true;

    // Check data attributes
    for (const attr of AD_DATA_ATTRS) {
      if (el.hasAttribute(attr)) return true;
    }

    // Check aria-label
    const ariaLabel = el.getAttribute('aria-label') || '';
    if (AD_ARIA_PATTERNS.some(p => p.test(ariaLabel))) return true;

    // Check for Google AdSense specific class
    if (el.classList && el.classList.contains('adsbygoogle')) return true;

    return false;
  }

  // Check if element contains main content (safety check)
  function containsMainContent(el) {
    const textLength = (el.textContent || '').trim().length;
    // If element has a lot of text, it might be main content
    if (textLength > 1000) {
      // But check if it's a known ad container
      const identifier = (el.className || '') + (el.id || '');
      if (matchesAdPattern(identifier)) return false;
      return true;
    }
    return false;
  }

  // Hide an ad element
  function hideAd(el) {
    if (containsMainContent(el)) return;
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.setAttribute('${MARKERS.adHidden}', 'true');
  }

  // Process all elements for ads
  function processAds() {
    const allElements = document.querySelectorAll('*');
    let hiddenCount = 0;

    allElements.forEach(el => {
      if (el.hasAttribute('${MARKERS.adHidden}')) return;
      if (isLikelyAd(el)) {
        hideAd(el);
        hiddenCount++;
      }
    });

    // Also hide common ad container selectors that might not match patterns
    const commonAdSelectors = [
      '.adsbygoogle',
      '[id^="google_ads"]',
      '[id^="div-gpt-ad"]',
      'ins.adsbygoogle',
      'amp-ad',
      'amp-embed[type="ad"]',
    ];

    commonAdSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!el.hasAttribute('${MARKERS.adHidden}')) {
            hideAd(el);
            hiddenCount++;
          }
        });
      } catch(e) {}
    });

    return hiddenCount;
  }

  // Initial processing
  const initialCount = processAds();
  console.log('[Browser Wand] Initially hidden', initialCount, 'ad elements');

  // Watch for dynamically loaded ads
  const observer = new MutationObserver((mutations) => {
    let newAds = 0;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (isLikelyAd(node)) {
            hideAd(node);
            newAds++;
          }
          // Also check children
          if (node.querySelectorAll) {
            node.querySelectorAll('*').forEach(child => {
              if (isLikelyAd(child) && !child.hasAttribute('${MARKERS.adHidden}')) {
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
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cleanup: collapse empty spaces left by hidden ads
  setTimeout(() => {
    document.querySelectorAll('[${MARKERS.adHidden}]').forEach(el => {
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
      el.style.setProperty('border', 'none', 'important');
    });
  }, 500);
})();`;

/**
 * Translation script template
 */
export const TRANSLATION_SCRIPT_TEMPLATE = `
(function() {
  const TRANSLATED_CONTENT = __TRANSLATED_CONTENT_PLACEHOLDER__;
  const TARGET_LANGUAGE = '__TARGET_LANGUAGE__';

  // Find main content area
  const contentSelectors = [
    '[itemprop="articleBody"]', 'article', 'main', '[role="main"]',
    '[class*="article-content"]', '[class*="post-content"]', '[class*="entry-content"]'
  ];

  let mainContent = null;
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent && mainContent.textContent.trim().length > 300) break;
  }

  if (!mainContent) {
    mainContent = document.body;
  }

  // Process paragraphs
  const paragraphs = mainContent.querySelectorAll('p');
  let translationIndex = 0;

  paragraphs.forEach((p, index) => {
    if (p.hasAttribute('${MARKERS.translated}')) return;
    if (p.textContent.trim().length < 50) return;

    const translation = TRANSLATED_CONTENT[translationIndex];
    if (!translation) return;

    // Create bilingual container
    const container = document.createElement('div');
    container.className = 'bw-bilingual-container';

    // Original text container
    const originalDiv = document.createElement('div');
    originalDiv.className = 'bw-original-text';
    const originalLabel = document.createElement('div');
    originalLabel.className = 'bw-translation-label';
    originalLabel.textContent = 'Original';
    originalDiv.appendChild(originalLabel);
    originalDiv.appendChild(p.cloneNode(true));

    // Translation container
    const translatedDiv = document.createElement('div');
    translatedDiv.className = 'bw-translated-text';
    const translatedLabel = document.createElement('div');
    translatedLabel.className = 'bw-translation-label';
    translatedLabel.textContent = TARGET_LANGUAGE;
    translatedDiv.appendChild(translatedLabel);
    const translatedP = document.createElement('p');
    translatedP.textContent = translation;
    translatedDiv.appendChild(translatedP);

    container.appendChild(originalDiv);
    container.appendChild(translatedDiv);

    p.parentNode.replaceChild(container, p);
    p.setAttribute('${MARKERS.translated}', 'true');
    translationIndex++;
  });

  // Process headings
  const headings = mainContent.querySelectorAll('h1, h2, h3');
  headings.forEach((h, index) => {
    if (h.hasAttribute('${MARKERS.translated}')) return;

    const headingTranslation = TRANSLATED_CONTENT[translationIndex];
    if (!headingTranslation) return;

    const translatedSpan = document.createElement('span');
    translatedSpan.className = 'bw-heading-translation';
    translatedSpan.textContent = headingTranslation;
    h.appendChild(translatedSpan);
    h.setAttribute('${MARKERS.translated}', 'true');
    translationIndex++;
  });

  // Add toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'bw-translation-toggle';
  toggleBtn.textContent = 'Toggle Translation';
  toggleBtn.onclick = function() {
    const translations = document.querySelectorAll('.bw-translated-text, .bw-heading-translation');
    translations.forEach(el => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
  };
  document.body.appendChild(toggleBtn);
})();`;

/**
 * Content insertion script template
 */
export const CONTENT_INSERTION_TEMPLATE = `
(function() {
  // Generate or prepare the content
  const contentToAdd = "Your generated content here";

  // Create styled container
  const container = document.createElement('div');
  container.id = 'browser-wand-added-content';
  container.style.cssText = 'background:#f0f7ff;border:1px solid #007bff;border-radius:8px;padding:20px;margin:20px auto;max-width:800px;font-family:sans-serif;';

  // Add title/header if needed
  const title = document.createElement('h3');
  title.textContent = 'Summary';
  title.style.cssText = 'margin:0 0 12px 0;color:#0056b3;';
  container.appendChild(title);

  // Add the content
  const content = document.createElement('div');
  content.textContent = contentToAdd;
  content.style.cssText = 'color:#333;line-height:1.6;white-space:pre-line;';
  container.appendChild(content);

  // Insert at top of main content with multiple fallbacks
  // IMPORTANT: Always include document.body as the final fallback
  const insertTarget = document.querySelector('main, article, [role="main"], #content, .content') || document.body;
  insertTarget.insertBefore(container, insertTarget.firstChild);
})();`;
