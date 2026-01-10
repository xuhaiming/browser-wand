/**
 * Summarization task handler
 * Handles page content summarization using chunked processing
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { summarizeInChunks } from '../../llm-client.js';
import { generateModalDisplayCode } from '../ui-generators/index.js';
import { convertToMarkdown } from '../utils/index.js';

/**
 * Handles summarization task
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's request
 * @param {Object} pageContent - Page content data
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Summarization result
 */
export async function handleSummarization(apiKey, prompt, pageContent, model) {
  console.log('[Browser Wand] handleSummarization started');
  const markdownContent = convertToMarkdown(pageContent);

  try {
    console.log('[Browser Wand] handleSummarization: Calling summarizeInChunks...');
    const summary = await summarizeInChunks(apiKey, markdownContent, prompt, model);
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
