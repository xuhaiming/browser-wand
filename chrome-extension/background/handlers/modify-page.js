/**
 * Page modification handler
 * Main entry point for handling MODIFY_PAGE message type
 * Routes requests to appropriate task handlers based on detected task type
 */

import { TASK_TYPES, SCRIPT_CATEGORIES, TASK_CATEGORY_MAP } from '../config.js';
import { callLLM, parseModificationResponse } from '../llm-client.js';
import { detectTaskType } from '../task-detector.js';
import { buildModifySystemPrompt, buildModifyUserMessage } from '../prompts/prompt-builder.js';
import {
  handleAnalysis,
  handleSummarization,
  handleTranslation,
  handleMagicBar,
} from './task-handlers/index.js';

/**
 * Task type to handler mapping
 * Maps each specialized task type to its handler function
 */
const TASK_HANDLERS = {
  [TASK_TYPES.SUMMARIZE]: handleSummarization,
  [TASK_TYPES.TRANSLATION]: handleTranslation,
  [TASK_TYPES.ANALYZE]: handleAnalysis,
  [TASK_TYPES.MAGIC_BAR]: handleMagicBar,
};

/**
 * Handles general page modification requests via LLM
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's modification request
 * @param {Object} pageContent - Page content data
 * @param {Object} previousModifications - Previously applied modifications
 * @param {string} taskType - Detected task type
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Modification result
 */
async function handleGeneralModification(apiKey, prompt, pageContent, previousModifications, taskType, model) {
  const systemPrompt = buildModifySystemPrompt(taskType, pageContent);
  const userMessage = buildModifyUserMessage(taskType, prompt, pageContent, null, previousModifications);

  console.log('[Browser Wand] Calling LLM...');
  const response = await callLLM(apiKey, systemPrompt, userMessage, model);
  console.log('[Browser Wand] LLM response received, parsing...');

  const parsed = parseModificationResponse(response);
  console.log('[Browser Wand] Parsed response:', {
    hasCode: !!parsed.code,
    codeLength: parsed.code?.length,
    hasCss: !!parsed.css,
    cssLength: parsed.css?.length,
    explanation: parsed.explanation?.substring(0, 100),
  });

  const scriptCategory = TASK_CATEGORY_MAP[taskType] || SCRIPT_CATEGORIES.STATIC_SCRIPT;

  return {
    success: true,
    data: {
      ...parsed,
      taskType,
      scriptCategory,
    },
  };
}

/**
 * Modifies a page based on user prompt
 * Routes to specialized handlers for known task types, falls back to general modification
 * @param {Object} payload - The request payload
 * @param {string} payload.apiKey - API key for authentication
 * @param {string} payload.prompt - User's modification request
 * @param {Object} payload.pageContent - Page content data
 * @param {Object} payload.previousModifications - Previously applied modifications
 * @param {string} [payload.model] - Optional model ID to use
 * @returns {Promise<Object>} - Modification result with success status
 */
export async function modifyPage({ apiKey, prompt, pageContent, previousModifications, model }) {
  console.log('[Browser Wand] modifyPage called:', {
    promptLength: prompt?.length,
    pageContentKeys: pageContent ? Object.keys(pageContent) : null,
    hasPreviousModifications: !!previousModifications,
    model: model || 'default',
  });

  const taskType = detectTaskType(prompt);
  console.log('[Browser Wand] Detected task type:', taskType);

  // Check if we have a specialized handler for this task type
  const handler = TASK_HANDLERS[taskType];
  if (handler) {
    console.log('[Browser Wand] Using specialized handler for:', taskType);
    return handler(apiKey, prompt, pageContent, previousModifications, model);
  }

  // Fall back to general modification handler
  console.log('[Browser Wand] Handling general modification task');
  try {
    return await handleGeneralModification(apiKey, prompt, pageContent, previousModifications, taskType, model);
  } catch (error) {
    console.error('[Browser Wand] modifyPage error:', error);
    return { success: false, error: error.message };
  }
}
