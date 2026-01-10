/**
 * Image generation handler
 * Handles image generation requests using Gemini's image generation API
 */

import { TASK_TYPES, SCRIPT_CATEGORIES } from '../../config.js';
import { generateImages } from '../../llm-client.js';
import { generateImageDisplayCode } from '../ui-generators/index.js';

/**
 * Handles image generation requests
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - User's image generation prompt
 * @param {Object} imageIntent - Detected image intent with options
 * @returns {Promise<Object>} - Image generation result with display code
 */
export async function handleImageGeneration(apiKey, prompt, imageIntent) {
  console.log('[Browser Wand] handleImageGeneration started:', {
    numberOfImages: imageIntent.numberOfImages,
    aspectRatio: imageIntent.aspectRatio,
  });

  try {
    const imageResult = await generateImages(apiKey, prompt, {
      numberOfImages: imageIntent.numberOfImages,
      aspectRatio: imageIntent.aspectRatio,
    });

    console.log('[Browser Wand] handleImageGeneration: Got result:', {
      success: imageResult.success,
      imageCount: imageResult.images?.length || 0,
    });

    const displayCode = generateImageDisplayCode(imageResult, prompt);

    const explanation = imageResult.success
      ? `Generated ${imageResult.images.length} image(s) for your request.`
      : `Image generation failed: ${imageResult.error || 'Unknown error'}`;

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
    console.error('[Browser Wand] handleImageGeneration error:', error);
    return {
      success: false,
      error: `Image generation failed: ${error.message}`,
    };
  }
}
