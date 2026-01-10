/**
 * Configuration constants for the Browser Wand extension
 */

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Best quality, slower' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast and efficient' },
];

export const DEFAULT_MODEL = 'gemini-3-pro-preview';

/**
 * Image generation model configuration (Nano Banana Pro)
 * Uses Gemini 3 Pro Image Preview for high-quality image generation
 */
export const IMAGE_GENERATION_CONFIG = {
  model: 'gemini-3-pro-image-preview',
  maxImages: 4,
  defaultAspectRatio: '1:1',
  defaultImageSize: '1K',
  supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
  supportedImageSizes: ['1K', '2K', '4K'],
};

export const API_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: DEFAULT_MODEL,
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
  THEMATIC_RESKINNING: 'THEMATIC_RESKINNING',
  ELEMENT_HIDING: 'ELEMENT_HIDING',
  TRANSLATION: 'TRANSLATION',
  SUMMARIZE: 'SUMMARIZE',
  ANALYZE: 'ANALYZE',
  MAGIC_BAR: 'MAGIC_BAR',
  GENERAL: 'GENERAL',
};

/**
 * Script execution categories:
 * - STATIC_SCRIPT: AI-generated scripts that can be saved and re-applied
 *   (e.g., hide ads, change colors, reader mode, element hiding)
 * - RUNTIME_LLM: Scripts that require fresh LLM API calls each time and cannot be saved
 *   (e.g., summarization, analysis - content-dependent one-time operations)
 * - SAVABLE_RUNTIME: Scripts that can be saved but require fresh LLM API calls when applied
 *   (e.g., translation - the prompt/intent can be saved, but content must be processed fresh)
 */
export const SCRIPT_CATEGORIES = {
  STATIC_SCRIPT: 'STATIC_SCRIPT',
  RUNTIME_LLM: 'RUNTIME_LLM',
  SAVABLE_RUNTIME: 'SAVABLE_RUNTIME',
};

/**
 * Maps task types to their script category
 * RUNTIME_LLM tasks require fresh API calls and cannot be saved
 * STATIC_SCRIPT tasks generate code that can be saved and re-executed
 * SAVABLE_RUNTIME tasks can be saved but require fresh API calls when applied
 */
export const TASK_CATEGORY_MAP = {
  [TASK_TYPES.CONTENT_EXTRACTION]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.AD_REMOVAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.COMMENT_REMOVAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.STYLING]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.THEMATIC_RESKINNING]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.ELEMENT_HIDING]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.GENERAL]: SCRIPT_CATEGORIES.STATIC_SCRIPT,
  [TASK_TYPES.TRANSLATION]: SCRIPT_CATEGORIES.SAVABLE_RUNTIME,
  [TASK_TYPES.SUMMARIZE]: SCRIPT_CATEGORIES.RUNTIME_LLM,
  [TASK_TYPES.ANALYZE]: SCRIPT_CATEGORIES.RUNTIME_LLM,
  [TASK_TYPES.MAGIC_BAR]: SCRIPT_CATEGORIES.RUNTIME_LLM,
};

export const CHUNKING_CONFIG = {
  maxChunkSize: 8000,
  chunkOverlap: 200,
  maxChunksPerRequest: 10,
  translationBatchSize: 15,
};

/**
 * Focus Mode configuration for eye tracking
 */
export const FOCUS_MODE_CONFIG = {
  highlightRadius: 100,            // Pixels around gaze point to highlight
  fontSizeMultiplier: 1.5,         // Text enlargement factor
  transitionDuration: 200,         // Animation duration in ms
  gazeSmoothing: 5,                // Number of frames to average for smooth tracking
  calibrationPoints: 9,            // Number of calibration points for eye tracking
  scrollZonePercent: 0.2,          // Percentage of viewport for scroll zones (20% = top/bottom 20%)
  scrollSpeed: 6,                  // Base pixels per frame to scroll
  scrollAcceleration: 1.5,         // Multiplier for scroll speed closer to edge
  scrollGazeDwellMs: 500,          // Time gaze must dwell in scroll zone before scrolling starts
  gazeTimeoutMs: 300,              // Time without gaze update before resetting highlights
};
