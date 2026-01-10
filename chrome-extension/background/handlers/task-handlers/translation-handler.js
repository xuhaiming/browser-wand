/**
 * Translation task handler
 * Handles page content translation with chunked processing
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { translateInChunks } from '../../llm-client.js';
import { extractTargetLanguage } from '../../task-detector.js';
import { generateTranslationCode } from '../ui-generators/index.js';
import { extractTextBlocks } from '../utils/index.js';

/**
 * Handles translation task with chunked processing
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's request
 * @param {Object} pageContent - Page content data
 * @param {Object} previousModifications - Previously applied modifications
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Translation result with modification data
 */
export async function handleTranslation(apiKey, prompt, pageContent, previousModifications, model) {
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
      headingTranslations = await translateInChunks(apiKey, headings, targetLanguage, model);
    }

    if (paragraphs.length > 0) {
      console.log('[Browser Wand] handleTranslation: Translating paragraphs...');
      paragraphTranslations = await translateInChunks(apiKey, paragraphs, targetLanguage, model);
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
        scriptCategory: SCRIPT_CATEGORIES.SAVABLE_RUNTIME,
        targetLanguage: targetLanguage,
      },
    };
  } catch (error) {
    console.error('[Browser Wand] handleTranslation error:', error);
    return { success: false, error: `Translation failed: ${error.message}` };
  }
}
