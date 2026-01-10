/**
 * Page modification handler
 * Handles the MODIFY_PAGE message type
 */

import { TASK_TYPES, SCRIPT_CATEGORIES, TASK_CATEGORY_MAP } from '../config.js';
import { callLLM, parseModificationResponse, translateInChunks, summarizeInChunks } from '../llm-client.js';
import { detectTaskType, extractTargetLanguage } from '../task-detector.js';
import { buildModifySystemPrompt, buildModifyUserMessage } from '../prompts/prompt-builder.js';
import { htmlToMarkdown } from '../utils/html-to-markdown.js';

/**
 * Converts page content to markdown for efficient LLM processing
 * @param {Object} pageContent - Page content data
 * @returns {string} - Markdown formatted content
 */
function convertToMarkdown(pageContent) {
  const markdown = htmlToMarkdown(pageContent.html, { maxLength: 40000 });
  return `# ${pageContent.title || 'Page Content'}\n\nSource: ${pageContent.url}\n\n---\n\n${markdown}`;
}

/**
 * Generates JavaScript code to display content in a modal overlay
 * @param {string} content - The content to display
 * @param {string} title - The modal title
 * @param {Object} options - Display options
 * @param {boolean} options.parseMarkdown - Whether to parse markdown formatting
 * @returns {string} - JavaScript code string
 */
function generateModalDisplayCode(content, title, { parseMarkdown = false } = {}) {
  const overlayId = 'browser-wand-modal-overlay';
  const contentProcessing = parseMarkdown
    ? `
    const formatted = content
      .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:16px 0 8px;color:#333;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:20px 0 10px;color:#333;">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="margin:24px 0 12px;color:#333;">$1</h2>')
      .replace(/^- (.+)$/gm, '<li style="margin:4px 0;margin-left:20px;">$1</li>')
      .replace(/\\n/g, '<br>');
    contentEl.innerHTML = formatted;`
    : `contentEl.style.whiteSpace = 'pre-wrap';
    contentEl.textContent = content;`;

  return `
(function() {
  var content = ${JSON.stringify(content)};
  var modalTitle = ${JSON.stringify(title)};

  var overlay = document.createElement('div');
  overlay.id = '${overlayId}';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';

  var modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:12px;max-width:800px;max-height:80vh;overflow:auto;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#666;line-height:1;';
  closeBtn.onclick = function() { overlay.remove(); };

  var titleEl = document.createElement('h2');
  titleEl.textContent = modalTitle;
  titleEl.style.cssText = 'margin:0 0 20px 0;color:#333;font-size:24px;padding-right:30px;';

  var contentEl = document.createElement('div');
  contentEl.style.cssText = 'color:#444;font-size:16px;line-height:1.7;';
  ${contentProcessing}

  modal.appendChild(closeBtn);
  modal.appendChild(titleEl);
  modal.appendChild(contentEl);
  overlay.appendChild(modal);

  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };

  document.body.appendChild(overlay);
})();`;
}

/**
 * Extracts main text blocks from page content for translation
 * Extracts headings and paragraphs separately to maintain proper matching
 * @param {Object} pageContent - Page content data
 * @returns {{ headings: string[], paragraphs: string[] }} - Object with headings and paragraphs arrays
 */
function extractTextBlocks(pageContent) {
  const headings = [];
  const paragraphs = [];
  const seenHeadings = new Set();
  const seenParagraphs = new Set();

  // Helper to normalize text for deduplication
  const normalize = (text) => text?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

  // Extract headings
  if (pageContent.elements?.headings) {
    pageContent.elements.headings.forEach((h) => {
      const text = h.text?.trim();
      if (!text || text.length < 5) return;
      const normalized = normalize(text);
      if (seenHeadings.has(normalized)) return;
      seenHeadings.add(normalized);
      headings.push(text);
    });
  }

  // Extract paragraphs from textBlocks (these come from content.js getTextBlocks)
  // which queries actual <p> elements in the DOM
  if (pageContent.textBlocks && Array.isArray(pageContent.textBlocks)) {
    pageContent.textBlocks.forEach((block) => {
      const text = block?.trim();
      if (!text || text.length < 30) return;
      const normalized = normalize(text);
      if (seenParagraphs.has(normalized)) return;
      seenParagraphs.add(normalized);
      paragraphs.push(text);
    });
  }

  console.log('[Browser Wand] extractTextBlocks: Extracted', headings.length, 'headings and', paragraphs.length, 'paragraphs');

  // Limit to prevent excessive API calls
  return {
    headings: headings.slice(0, 15),
    paragraphs: paragraphs.slice(0, 35),
  };
}

/**
 * Parses the analysis response from the LLM
 * @param {string} response - Raw LLM response
 * @returns {Object} - Parsed analysis object with analysis and title
 */
function parseAnalysisResponse(response) {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();
    const parsed = JSON.parse(jsonStr);
    return {
      analysis: parsed.analysis || response,
      title: parsed.title || 'Page Analysis',
    };
  } catch {
    return {
      analysis: response,
      title: 'Page Analysis',
    };
  }
}

/**
 * Handles analysis task - analyzes page content and displays result in overlay
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's request
 * @param {Object} pageContent - Page content data
 * @param {Object} previousModifications - Previously applied modifications
 * @returns {Promise<Object>} - Analysis result with display code
 */
async function handleAnalysis(apiKey, prompt, pageContent, previousModifications) {
  console.log('[Browser Wand] handleAnalysis started');
  const systemPrompt = buildModifySystemPrompt(TASK_TYPES.ANALYZE, pageContent);
  const userMessage = buildModifyUserMessage(TASK_TYPES.ANALYZE, prompt, pageContent, null, previousModifications);

  try {
    console.log('[Browser Wand] handleAnalysis: Calling LLM...');
    const response = await callLLM(apiKey, systemPrompt, userMessage);
    console.log('[Browser Wand] handleAnalysis: LLM response received');
    const { analysis, title } = parseAnalysisResponse(response);
    const displayCode = generateModalDisplayCode(analysis, title, { parseMarkdown: true });

    console.log('[Browser Wand] handleAnalysis: Returning success response');
    return {
      success: true,
      data: {
        code: displayCode,
        css: '',
        explanation: 'Analysis completed and displayed in a modal overlay.',
        taskType: TASK_TYPES.ANALYZE,
        scriptCategory: SCRIPT_CATEGORIES.RUNTIME_LLM,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleAnalysis error:', error);
    return { success: false, error: `Analysis failed: ${error.message}` };
  }
}

/**
 * Handles summarization task
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's request
 * @param {Object} pageContent - Page content data
 * @returns {Promise<Object>} - Summarization result
 */
async function handleSummarization(apiKey, prompt, pageContent) {
  console.log('[Browser Wand] handleSummarization started');
  const markdownContent = convertToMarkdown(pageContent);

  try {
    console.log('[Browser Wand] handleSummarization: Calling summarizeInChunks...');
    const summary = await summarizeInChunks(apiKey, markdownContent, prompt);
    console.log('[Browser Wand] handleSummarization: Summary received');
    const displayCode = generateModalDisplayCode(summary, 'Page Summary', { parseMarkdown: false });

    console.log('[Browser Wand] handleSummarization: Returning success response');
    return {
      success: true,
      data: {
        code: displayCode,
        css: '',
        explanation: 'Summary generated and displayed in a modal overlay.',
        taskType: TASK_TYPES.SUMMARIZE,
        scriptCategory: SCRIPT_CATEGORIES.RUNTIME_LLM,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleSummarization error:', error);
    return { success: false, error: `Summarization failed: ${error.message}` };
  }
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
function generateTranslationCode(headings, headingTranslations, paragraphs, paragraphTranslations, targetLanguage) {
  const headingPairs = headings.map((original, i) => ({
    original: original,
    translated: headingTranslations[i] || '[Translation unavailable]',
  }));

  const paragraphPairs = paragraphs.map((original, i) => ({
    original: original,
    translated: paragraphTranslations[i] || '[Translation unavailable]',
  }));

  return `
(function() {
  const HEADING_PAIRS = ${JSON.stringify(headingPairs)};
  const PARAGRAPH_PAIRS = ${JSON.stringify(paragraphPairs)};
  const TARGET_LANGUAGE = ${JSON.stringify(targetLanguage)};

  // Inject CSS styles for bilingual layout
  const style = document.createElement('style');
  style.id = 'browser-wand-translation-styles';
  style.textContent = \`
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
  \`;
  document.head.appendChild(style);

  // Find main content area with multiple fallbacks
  const contentSelectors = [
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
    '.content'
  ];

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

/**
 * Handles translation task with chunked processing
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's request
 * @param {Object} pageContent - Page content data
 * @param {Object} previousModifications - Previously applied modifications
 * @returns {Promise<Object>} - Translation result with modification data
 */
async function handleTranslation(apiKey, prompt, pageContent, previousModifications) {
  console.log('[Browser Wand] handleTranslation started');
  const targetLanguage = extractTargetLanguage(prompt) || 'Chinese';
  const { headings, paragraphs } = extractTextBlocks(pageContent);
  const totalBlocks = headings.length + paragraphs.length;
  console.log('[Browser Wand] handleTranslation: Found', headings.length, 'headings and', paragraphs.length, 'paragraphs to translate to', targetLanguage);

  if (totalBlocks === 0) {
    console.warn('[Browser Wand] handleTranslation: No translatable content found');
    return { success: false, error: 'No translatable content found on the page.' };
  }

  try {
    // Translate headings and paragraphs separately to maintain alignment
    let headingTranslations = [];
    let paragraphTranslations = [];

    if (headings.length > 0) {
      console.log('[Browser Wand] handleTranslation: Translating headings...');
      headingTranslations = await translateInChunks(apiKey, headings, targetLanguage);
    }

    if (paragraphs.length > 0) {
      console.log('[Browser Wand] handleTranslation: Translating paragraphs...');
      paragraphTranslations = await translateInChunks(apiKey, paragraphs, targetLanguage);
    }

    console.log('[Browser Wand] handleTranslation: Translations received -', headingTranslations.length, 'headings,', paragraphTranslations.length, 'paragraphs');

    // Generate the translation code with separate heading and paragraph pairs
    const code = generateTranslationCode(headings, headingTranslations, paragraphs, paragraphTranslations, targetLanguage);

    console.log('[Browser Wand] handleTranslation: Returning success response');
    return {
      success: true,
      data: {
        code: code,
        css: '',
        explanation: `Translated ${headingTranslations.length} headings and ${paragraphTranslations.length} paragraphs to ${targetLanguage} with side-by-side display.`,
        taskType: TASK_TYPES.TRANSLATION,
        scriptCategory: SCRIPT_CATEGORIES.RUNTIME_LLM,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleTranslation error:', error);
    return { success: false, error: `Translation failed: ${error.message}` };
  }
}

/**
 * Modifies a page based on user prompt
 * @param {Object} payload - The request payload
 * @param {string} payload.apiKey - API key for authentication
 * @param {string} payload.prompt - User's modification request
 * @param {Object} payload.pageContent - Page content data
 * @param {Object} payload.previousModifications - Previously applied modifications
 * @returns {Promise<Object>} - Modification result with success status
 */
export async function modifyPage({ apiKey, prompt, pageContent, previousModifications }) {
  console.log('[Browser Wand] modifyPage called:', {
    promptLength: prompt?.length,
    pageContentKeys: pageContent ? Object.keys(pageContent) : null,
    hasPreviousModifications: !!previousModifications,
  });

  const taskType = detectTaskType(prompt);
  console.log('[Browser Wand] Detected task type:', taskType);

  if (taskType === TASK_TYPES.SUMMARIZE) {
    console.log('[Browser Wand] Handling summarization task');
    return handleSummarization(apiKey, prompt, pageContent);
  }

  if (taskType === TASK_TYPES.TRANSLATION) {
    console.log('[Browser Wand] Handling translation task');
    return handleTranslation(apiKey, prompt, pageContent, previousModifications);
  }

  if (taskType === TASK_TYPES.ANALYZE) {
    console.log('[Browser Wand] Handling analysis task');
    return handleAnalysis(apiKey, prompt, pageContent, previousModifications);
  }

  console.log('[Browser Wand] Handling general modification task');
  const systemPrompt = buildModifySystemPrompt(taskType, pageContent);
  const userMessage = buildModifyUserMessage(taskType, prompt, pageContent, null, previousModifications);

  try {
    console.log('[Browser Wand] Calling LLM...');
    const response = await callLLM(apiKey, systemPrompt, userMessage);
    console.log('[Browser Wand] LLM response received, parsing...');
    const parsed = parseModificationResponse(response);
    console.log('[Browser Wand] Parsed response:', {
      hasCode: !!parsed.code,
      codeLength: parsed.code?.length,
      hasCss: !!parsed.css,
      cssLength: parsed.css?.length,
      explanation: parsed.explanation?.substring(0, 100),
    });

    // Add task type and script category to response
    const scriptCategory = TASK_CATEGORY_MAP[taskType] || SCRIPT_CATEGORIES.STATIC_SCRIPT;
    return {
      success: true,
      data: {
        ...parsed,
        taskType,
        scriptCategory,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] modifyPage error:', error);
    return { success: false, error: error.message };
  }
}
