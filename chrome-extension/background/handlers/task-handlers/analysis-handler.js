/**
 * Analysis task handler
 * Handles page content analysis and returns results in modal overlay
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { callLLM } from '../../llm-client.js';
import { buildModifySystemPrompt, buildModifyUserMessage } from '../../prompts/prompt-builder.js';
import { generateModalDisplayCode } from '../ui-generators/index.js';

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
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Analysis result with display code
 */
export async function handleAnalysis(apiKey, prompt, pageContent, previousModifications, model) {
  console.log('[Browser Wand] handleAnalysis started');
  const systemPrompt = buildModifySystemPrompt(TASK_TYPES.ANALYZE, pageContent);
  const userMessage = buildModifyUserMessage(TASK_TYPES.ANALYZE, prompt, pageContent, null, previousModifications);

  try {
    console.log('[Browser Wand] handleAnalysis: Calling LLM...');
    const response = await callLLM(apiKey, systemPrompt, userMessage, model);
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
