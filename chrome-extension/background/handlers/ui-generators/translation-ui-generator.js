/**
 * Translation UI generator
 * Generates JavaScript code to display side-by-side translations
 */

const TRANSLATION_STYLES = `
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
  .bw-heading-translation {
    display: block !important;
    font-size: 0.85em !important;
    color: #555 !important;
    font-style: italic !important;
    margin-top: 8px !important;
    font-weight: normal !important;
    padding: 8px 12px !important;
    background: #f0f7ff !important;
    border-left: 3px solid #007bff !important;
    border-radius: 4px !important;
  }
  .bw-translation-toggle {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    padding: 12px 24px !important;
    background: #007bff !important;
    color: white !important;
    border: none !important;
    border-radius: 24px !important;
    cursor: pointer !important;
    z-index: 999999 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 12px rgba(0,123,255,0.3) !important;
    transition: all 0.2s ease !important;
  }
  .bw-translation-toggle:hover {
    background: #0056b3 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(0,123,255,0.4) !important;
  }
`;

const CONTENT_SELECTORS = [
  '[itemprop="articleBody"]',
  'article',
  'main',
  '[role="main"]',
  '[class*="article-content"]',
  '[class*="article-body"]',
  '[class*="post-content"]',
  '[class*="entry-content"]',
  '[class*="content-body"]',
  '#content',
  '.content',
];

/**
 * Creates translation pair objects from original texts and translations
 * @param {string[]} originals - Original texts
 * @param {string[]} translations - Translated texts
 * @returns {Array<{original: string, translated: string}>} - Paired objects
 */
function createTranslationPairs(originals, translations) {
  return originals.map((original, i) => ({
    original,
    translated: translations[i] || '[Translation unavailable]',
  }));
}

/**
 * Generates JavaScript code to display side-by-side translations
 * @param {string[]} headings - Array of original heading texts
 * @param {string[]} headingTranslations - Array of translated headings
 * @param {string[]} paragraphs - Array of original paragraph texts
 * @param {string[]} paragraphTranslations - Array of translated paragraphs
 * @param {string} targetLanguage - Target language name
 * @returns {string} - JavaScript code string
 */
export function generateTranslationCode(headings, headingTranslations, paragraphs, paragraphTranslations, targetLanguage) {
  const headingPairs = createTranslationPairs(headings, headingTranslations);
  const paragraphPairs = createTranslationPairs(paragraphs, paragraphTranslations);

  return `
(function() {
  const HEADING_PAIRS = ${JSON.stringify(headingPairs)};
  const PARAGRAPH_PAIRS = ${JSON.stringify(paragraphPairs)};
  const TARGET_LANGUAGE = ${JSON.stringify(targetLanguage)};

  // Inject CSS styles for bilingual layout
  const style = document.createElement('style');
  style.id = 'browser-wand-translation-styles';
  style.textContent = \`${TRANSLATION_STYLES}\`;
  document.head.appendChild(style);

  // Find main content area with multiple fallbacks
  const contentSelectors = ${JSON.stringify(CONTENT_SELECTORS)};

  let mainContent = null;
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > 200) {
      mainContent = el;
      break;
    }
  }

  if (!mainContent) {
    mainContent = document.body;
  }

  console.log('[Browser Wand] Translation: Main content found:', mainContent.tagName, mainContent.className);

  // Helper function to normalize text for comparison
  function normalizeText(text) {
    return text.replace(/\\s+/g, ' ').trim().toLowerCase();
  }

  // Helper function to find best match in a pairs array
  function findBestMatch(elementText, pairs) {
    const normalizedElement = normalizeText(elementText);
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      if (pair.used) continue;

      const normalizedOriginal = normalizeText(pair.original);

      // Check for exact or near-exact match
      if (normalizedElement === normalizedOriginal) {
        return { pair, index: i, score: 1 };
      }

      // Check if element text contains the original or vice versa
      if (normalizedElement.includes(normalizedOriginal) || normalizedOriginal.includes(normalizedElement)) {
        const score = Math.min(normalizedElement.length, normalizedOriginal.length) /
                      Math.max(normalizedElement.length, normalizedOriginal.length);
        if (score > bestScore && score > 0.5) {
          bestScore = score;
          bestMatch = { pair, index: i, score };
        }
      }
    }

    return bestMatch;
  }

  let translatedCount = 0;

  // Process paragraphs using PARAGRAPH_PAIRS
  const paragraphElements = mainContent.querySelectorAll('p');
  paragraphElements.forEach((p) => {
    if (p.hasAttribute('data-bw-translated')) return;
    if (p.closest('.bw-bilingual-container')) return;

    const text = p.textContent.trim();
    if (text.length < 30) return;

    const match = findBestMatch(text, PARAGRAPH_PAIRS);
    if (!match) return;

    PARAGRAPH_PAIRS[match.index].used = true;

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
    const originalP = document.createElement('p');
    originalP.textContent = text;
    originalP.style.margin = '0';
    originalDiv.appendChild(originalP);

    // Translation container
    const translatedDiv = document.createElement('div');
    translatedDiv.className = 'bw-translated-text';
    const translatedLabel = document.createElement('div');
    translatedLabel.className = 'bw-translation-label';
    translatedLabel.textContent = TARGET_LANGUAGE;
    translatedDiv.appendChild(translatedLabel);
    const translatedP = document.createElement('p');
    translatedP.textContent = match.pair.translated;
    translatedP.style.margin = '0';
    translatedDiv.appendChild(translatedP);

    container.appendChild(originalDiv);
    container.appendChild(translatedDiv);

    p.setAttribute('data-bw-translated', 'true');
    p.parentNode.replaceChild(container, p);
    translatedCount++;
  });

  // Process headings using HEADING_PAIRS
  const headingElements = mainContent.querySelectorAll('h1, h2, h3, h4');
  headingElements.forEach((h) => {
    if (h.hasAttribute('data-bw-translated')) return;
    if (h.querySelector('.bw-heading-translation')) return;

    const text = h.textContent.trim();
    if (text.length < 5) return;

    const match = findBestMatch(text, HEADING_PAIRS);
    if (!match) return;

    HEADING_PAIRS[match.index].used = true;

    const translatedSpan = document.createElement('span');
    translatedSpan.className = 'bw-heading-translation';
    translatedSpan.textContent = match.pair.translated;
    h.appendChild(translatedSpan);
    h.setAttribute('data-bw-translated', 'true');
    translatedCount++;
  });

  console.log('[Browser Wand] Translation: Applied', translatedCount, 'translations');

  // Add toggle button
  if (translatedCount > 0) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'bw-translation-toggle';
    toggleBtn.textContent = 'Toggle Translations';
    let visible = true;
    toggleBtn.onclick = function() {
      visible = !visible;
      const translations = document.querySelectorAll('.bw-translated-text, .bw-heading-translation');
      translations.forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
      toggleBtn.textContent = visible ? 'Toggle Translations' : 'Show Translations';
    };
    document.body.appendChild(toggleBtn);
  } else {
    console.warn('[Browser Wand] Translation: No translations were applied. Text matching failed.');
  }
})();`;
}
