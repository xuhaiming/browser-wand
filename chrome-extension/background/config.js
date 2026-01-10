/**
 * Configuration constants for the Browser Wand extension
 */

export const API_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-2.0-flash',
  maxOutputTokens: 4096,
  temperature: 1.0,
};

export const CONTENT_LIMITS = {
  htmlSubstringLength: 15000,
  textSubstringLength: 5000,
  linksPreviewCount: 10,
  htmlContextLength: 20000,
  adsPreviewCount: 15,
  minArticleTextLength: 300,
  minFallbackTextLength: 500,
  substantialTextLength: 1000,
};

export const TASK_TYPES = {
  CONTENT_EXTRACTION: 'CONTENT_EXTRACTION',
  AD_REMOVAL: 'AD_REMOVAL',
  COMMENT_REMOVAL: 'COMMENT_REMOVAL',
  STYLING: 'STYLING',
  ELEMENT_HIDING: 'ELEMENT_HIDING',
  TRANSLATION: 'TRANSLATION',
  SUMMARIZE: 'SUMMARIZE',
  ANALYZE: 'ANALYZE',
  GENERAL: 'GENERAL',
};

/**
 * Script execution categories:
 * - STATIC_SCRIPT: AI-generated scripts that can be saved and re-applied
 *   (e.g., hide ads, change colors, reader mode, element hiding)
 * - RUNTIME_LLM: Scripts that require fresh LLM API calls each time
 *   (e.g., translation, summarization, analysis - content-dependent)
 */
export const SCRIPT_CATEGORIES = {
  STATIC_SCRIPT: 'STATIC_SCRIPT',
  RUNTIME_LLM: 'RUNTIME_LLM',
};

/**
 * Maps task types to their script category
 * RUNTIME_LLM tasks require fresh API calls and cannot be simply re-applied
 * STATIC_SCRIPT tasks generate code that can be saved and re-executed
 */
export const TASK_CATEGORY_MAP = {
  [TASK_TYPES.CONTENT_EXTRACTION]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.AD_REMOVAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.COMMENT_REMOVAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.STYLING]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.ELEMENT_HIDING]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.GENERAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.TRANSLATION]: SCRIPT_CATEGORIES.RUNTIME_LLM,
  [TASK_TYPES.SUMMARIZE]: SCRIPT_CATEGORIES.RUNTIME_LLM,
  [TASK_TYPES.ANALYZE]: SCRIPT_CATEGORIES.RUNTIME_LLM,
};

export const CHUNKING_CONFIG = {
  maxChunkSize: 8000,
  chunkOverlap: 200,
  maxChunksPerRequest: 10,
  translationBatchSize: 15,
};
