/**
 * Translation script generator for bilingual display
 */

import { MARKERS } from '../../selectors.js';
import { ScriptBuilder, replacePlaceholders } from '../script-builder.js';
import {
  CONTENT_THRESHOLDS,
  ELEMENT_SELECTORS,
  CSS_CLASSES,
  mergeConfig,
} from '../config.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  minParagraphLength: CONTENT_THRESHOLDS.minParagraphLength,
  minContentLength: CONTENT_THRESHOLDS.minContentLength,
  translatedMarker: MARKERS.translated,
  containerClass: CSS_CLASSES.bilingualContainer,
  originalClass: CSS_CLASSES.originalText,
  translatedClass: CSS_CLASSES.translatedText,
  labelClass: CSS_CLASSES.translationLabel,
  headingClass: CSS_CLASSES.headingTranslation,
  toggleClass: CSS_CLASSES.translationToggle,
  inlineClass: CSS_CLASSES.inlineTranslation,
};

/**
 * Generates code to create bilingual paragraph container
 */
function getBilingualContainerCode(config) {
  return `
function createBilingualContainer(originalElement, translatedText, targetLanguage) {
  const container = document.createElement('div');
  container.className = '${config.containerClass}';

  const originalDiv = document.createElement('div');
  originalDiv.className = '${config.originalClass}';
  const originalLabel = document.createElement('div');
  originalLabel.className = '${config.labelClass}';
  originalLabel.textContent = 'Original';
  originalDiv.appendChild(originalLabel);
  originalDiv.appendChild(originalElement.cloneNode(true));

  const translatedDiv = document.createElement('div');
  translatedDiv.className = '${config.translatedClass}';
  const translatedLabel = document.createElement('div');
  translatedLabel.className = '${config.labelClass}';
  translatedLabel.textContent = targetLanguage;
  translatedDiv.appendChild(translatedLabel);
  const translatedP = document.createElement('p');
  translatedP.textContent = translatedText;
  translatedDiv.appendChild(translatedP);

  container.appendChild(originalDiv);
  container.appendChild(translatedDiv);

  return container;
}`;
}

/**
 * Generates code to process paragraphs
 */
function getParagraphProcessingCode(config) {
  return `
function processParagraphs(mainContent, translations, targetLanguage) {
  const paragraphs = mainContent.querySelectorAll('p');
  let translationIndex = 0;

  paragraphs.forEach((p) => {
    if (p.hasAttribute('${config.translatedMarker}')) return;
    if (p.textContent.trim().length < ${config.minParagraphLength}) return;

    const translation = translations[translationIndex];
    if (!translation) return;

    const container = createBilingualContainer(p, translation, targetLanguage);
    p.parentNode.replaceChild(container, p);
    p.setAttribute('${config.translatedMarker}', 'true');
    translationIndex++;
  });

  return translationIndex;
}`;
}

/**
 * Generates code to process headings
 */
function getHeadingProcessingCode(config) {
  return `
function processHeadings(mainContent, translations, startIndex) {
  const headings = mainContent.querySelectorAll('${ELEMENT_SELECTORS.headings}');
  let translationIndex = startIndex;

  headings.forEach((h) => {
    if (h.hasAttribute('${config.translatedMarker}')) return;

    const translation = translations[translationIndex];
    if (!translation) return;

    const translatedSpan = document.createElement('span');
    translatedSpan.className = '${config.headingClass}';
    translatedSpan.textContent = translation;
    h.appendChild(translatedSpan);
    h.setAttribute('${config.translatedMarker}', 'true');
    translationIndex++;
  });
}`;
}

/**
 * Generates code for the toggle button
 */
function getToggleButtonCode(config) {
  return `
function addToggleButton() {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = '${config.toggleClass}';
  toggleBtn.textContent = 'Toggle Translation';
  toggleBtn.onclick = function() {
    const translations = document.querySelectorAll('.${config.translatedClass}, .${config.headingClass}');
    translations.forEach(el => {
      el.style.display = el.style.display === 'none' ? '' : 'none';
    });
  };
  document.body.appendChild(toggleBtn);
}`;
}

/**
 * Generates content finder code
 */
function getContentFinderCode(config) {
  return `
function findMainContent() {
  const contentSelectors = ${JSON.stringify(ELEMENT_SELECTORS.mainContent)};
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > ${config.minContentLength}) {
      return el;
    }
  }
  return document.body;
}`;
}

/**
 * Generates the translation script template
 * Returns a template with placeholders for content and language
 */
export function getTranslationScriptTemplate(options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const mainExecution = `
const TRANSLATED_CONTENT = __TRANSLATED_CONTENT_PLACEHOLDER__;
const TARGET_LANGUAGE = '__TARGET_LANGUAGE__';

const mainContent = findMainContent();

const paragraphCount = processParagraphs(mainContent, TRANSLATED_CONTENT, TARGET_LANGUAGE);
processHeadings(mainContent, TRANSLATED_CONTENT, paragraphCount);

addToggleButton();`;

  return ScriptBuilder.create()
    .sections(
      getContentFinderCode(config),
      getBilingualContainerCode(config),
      getParagraphProcessingCode(config),
      getHeadingProcessingCode(config),
      getToggleButtonCode(config),
      mainExecution
    )
    .build();
}

/**
 * Generates a translation script with actual content
 */
export function generateTranslationScript(translations, targetLanguage, options = {}) {
  const template = getTranslationScriptTemplate(options);
  return replacePlaceholders(template, {
    TRANSLATED_CONTENT_PLACEHOLDER: translations,
    TARGET_LANGUAGE: targetLanguage,
  });
}

/**
 * Generates a simple inline translation script
 */
export function generateInlineTranslationScript(translationMap, targetLanguage, options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const code = `
const translations = ${JSON.stringify(translationMap)};
const targetLanguage = ${JSON.stringify(targetLanguage)};

const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

let node;
while (node = walker.nextNode()) {
  const text = node.textContent.trim();
  if (translations[text]) {
    const span = document.createElement('span');
    span.className = '${config.inlineClass}';
    span.textContent = translations[text];
    node.parentNode.insertBefore(span, node.nextSibling);
  }
}

console.log('[Browser Wand] Applied inline translations');`;

  return ScriptBuilder.create().section(code).build();
}

/**
 * Generates a translation script for specific elements
 */
export function generateTargetedTranslationScript(elementSelector, translations, targetLanguage, options = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const code = `
const translations = ${JSON.stringify(translations)};
const targetLanguage = ${JSON.stringify(targetLanguage)};
const elements = document.querySelectorAll('${elementSelector}');
let index = 0;

elements.forEach(el => {
  if (el.hasAttribute('${config.translatedMarker}') || index >= translations.length) return;

  const translatedSpan = document.createElement('span');
  translatedSpan.className = '${config.headingClass}';
  translatedSpan.textContent = ' (' + translations[index] + ')';
  el.appendChild(translatedSpan);
  el.setAttribute('${config.translatedMarker}', 'true');
  index++;
});

console.log('[Browser Wand] Translated', index, 'elements');`;

  return ScriptBuilder.create().section(code).build();
}
