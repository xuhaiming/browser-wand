/**
 * Magic Bar search handler
 * Handles universal search using Gemini with Google Search grounding
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { magicBarSearch, detectImageGenerationIntent, detectNewsTimelineIntent, newsTimelineSearch } from '../../llm-client.js';
import { generateMagicBarDisplayCode, generateNewsTimelineDisplayCode } from '../ui-generators/index.js';
import { extractProductInfo, isProductPageContext } from '../utils/index.js';
import { handleImageGeneration } from './image-generation-handler.js';
import { htmlToMarkdown } from '../../utils/html-to-markdown.js';

// Limits for context extraction to prevent timeouts
const CONTEXT_LIMITS = {
  maxSelectedTextLength: 500,
  maxMajorContentLength: 2000,
  maxMarkdownLength: 3000,
};

/**
 * Extracts major content from page as condensed markdown
 * Focuses on headings and first few paragraphs for context
 * @param {Object} pageContent - Page content data
 * @returns {string} - Condensed markdown content
 */
function extractMajorContent(pageContent) {
  if (!pageContent.html) {
    // Fallback to text blocks if HTML is not available
    if (pageContent.textBlocks && pageContent.textBlocks.length > 0) {
      return pageContent.textBlocks.slice(0, 3).join('\n\n').substring(0, CONTEXT_LIMITS.maxMajorContentLength);
    }
    return '';
  }

  // Convert HTML to markdown with strict limit
  const markdown = htmlToMarkdown(pageContent.html, { maxLength: CONTEXT_LIMITS.maxMarkdownLength });

  // Extract only the first portion focusing on headings and intro paragraphs
  const lines = markdown.split('\n');
  const majorLines = [];
  let charCount = 0;

  for (const line of lines) {
    if (charCount >= CONTEXT_LIMITS.maxMajorContentLength) break;

    const trimmedLine = line.trim();
    // Prioritize headings and non-empty content
    if (trimmedLine.startsWith('#') || trimmedLine.length > 20) {
      majorLines.push(trimmedLine);
      charCount += trimmedLine.length;
    }
  }

  return majorLines.join('\n').substring(0, CONTEXT_LIMITS.maxMajorContentLength);
}

/**
 * Builds search context from page content
 * Extracts condensed content to prevent API timeouts
 * @param {Object} pageContent - Page content data
 * @returns {Object} - Context object for search
 */
function buildSearchContext(pageContent) {
  // Limit selectedText to prevent large payloads
  let selectedText = pageContent.selectedText || '';
  if (selectedText.length > CONTEXT_LIMITS.maxSelectedTextLength) {
    selectedText = selectedText.substring(0, CONTEXT_LIMITS.maxSelectedTextLength) + '...';
  }

  const context = {
    url: pageContent.url || '',
    pageTitle: pageContent.title || '',
    selectedText,
    majorContent: extractMajorContent(pageContent),
  };

  // Check if this might be a product search based on page context
  const productInfo = extractProductInfo(pageContent);
  if (productInfo.name && isProductPageContext(pageContent)) {
    context.productName = productInfo.name;
  }

  return context;
}

/**
 * Builds explanation message based on search result type
 * @param {Object} searchResult - Search result from magicBarSearch
 * @returns {string} - Explanation message
 */
function buildExplanation(searchResult) {
  const resultCount = searchResult.type === 'products'
    ? searchResult.results?.length || 0
    : searchResult.sources?.length || 0;

  return searchResult.type === 'products'
    ? `Found ${resultCount} products matching your search.`
    : `Found information with ${resultCount} sources.`;
}

/**
 * Handles Magic Bar search - universal search feature using Gemini with Google Search grounding
 * Also supports image generation when the query requests images
 * Also supports news timeline search for news/current events queries
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's search query
 * @param {Object} pageContent - Page content data for context
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Search result with display code
 */
export async function handleMagicBar(apiKey, prompt, pageContent, model) {
  console.log('[Browser Wand] handleMagicBar started');

  // Check if this is an image generation request
  const imageIntent = detectImageGenerationIntent(prompt);
  if (imageIntent.isImageRequest) {
    console.log('[Browser Wand] handleMagicBar: Detected image generation request');
    const context = buildSearchContext(pageContent);
    return handleImageGeneration(apiKey, prompt, imageIntent, context);
  }

  // Check if this is a news timeline request
  const isNewsTimeline = detectNewsTimelineIntent(prompt);
  if (isNewsTimeline) {
    console.log('[Browser Wand] handleMagicBar: Detected news timeline request');
    return handleNewsTimeline(apiKey, prompt, pageContent, model);
  }

  const context = buildSearchContext(pageContent);
  console.log('[Browser Wand] handleMagicBar: Context:', context);

  try {
    console.log('[Browser Wand] handleMagicBar: Searching...');
    const searchResult = await magicBarSearch(apiKey, prompt, context, model);
    console.log('[Browser Wand] handleMagicBar: Got result type:', searchResult.type);

    const displayCode = generateMagicBarDisplayCode(searchResult, prompt);
    const explanation = buildExplanation(searchResult);

    return {
      success: true,
      data: {
        code: displayCode,
        css: '',
        explanation,
        taskType: TASK_TYPES.MAGIC_BAR,
        scriptCategory: SCRIPT_CATEGORIES.RUNTIME_LLM,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleMagicBar error:', error);
    return {
      success: false,
      error: `Magic Bar search failed: ${error.message}`,
    };
  }
}

/**
 * Handles news timeline search - searches for news background and displays as timeline
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's search query
 * @param {Object} pageContent - Page content data for context
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Search result with timeline display code
 */
async function handleNewsTimeline(apiKey, prompt, pageContent, model) {
  const context = buildSearchContext(pageContent);
  console.log('[Browser Wand] handleNewsTimeline: Context:', context);

  try {
    console.log('[Browser Wand] handleNewsTimeline: Searching for news timeline...');
    const searchResult = await newsTimelineSearch(apiKey, prompt, context, model);
    console.log('[Browser Wand] handleNewsTimeline: Got result with', searchResult.timeline?.length || 0, 'events');

    const displayCode = generateNewsTimelineDisplayCode(searchResult, prompt);
    const timelineCount = searchResult.timeline?.length || 0;
    const explanation = `Found ${timelineCount} timeline events with background information.`;

    return {
      success: true,
      data: {
        code: displayCode,
        css: '',
        explanation,
        taskType: TASK_TYPES.MAGIC_BAR,
        scriptCategory: SCRIPT_CATEGORIES.RUNTIME_LLM,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleNewsTimeline error:', error);
    return {
      success: false,
      error: `News timeline search failed: ${error.message}`,
    };
  }
}
