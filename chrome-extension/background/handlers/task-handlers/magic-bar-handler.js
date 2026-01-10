/**
 * Magic Bar search handler
 * Handles universal search using Gemini with Google Search grounding
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { magicBarSearch, detectImageGenerationIntent } from '../../llm-client.js';
import { generateMagicBarDisplayCode } from '../ui-generators/index.js';
import { extractProductInfo, isProductPageContext } from '../utils/index.js';
import { handleImageGeneration } from './image-generation-handler.js';

/**
 * Builds search context from page content
 * @param {Object} pageContent - Page content data
 * @returns {Object} - Context object for search
 */
function buildSearchContext(pageContent) {
  const context = {
    url: pageContent.url || '',
    pageTitle: pageContent.title || '',
    selectedText: pageContent.selectedText || '',
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
    return handleImageGeneration(apiKey, prompt, imageIntent);
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
