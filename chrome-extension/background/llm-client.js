/**
 * LLM API client module
 * Handles communication with the official Gemini API
 */

import { API_CONFIG, CHUNKING_CONFIG } from './config.js';

/**
 * Builds the Gemini API URL with the API key
 * @param {string} apiKey - The API key for authentication
 * @returns {string} - The complete API URL
 */
function buildApiUrl(apiKey) {
  return `${API_CONFIG.baseUrl}/models/${API_CONFIG.model}:generateContent?key=${apiKey}`;
}

/**
 * Builds the request body for Gemini API
 * @param {string} systemPrompt - The system prompt
 * @param {string} userMessage - The user message
 * @returns {Object} - The request body object
 */
function buildRequestBody(systemPrompt, userMessage) {
  return {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      maxOutputTokens: API_CONFIG.maxOutputTokens,
      temperature: API_CONFIG.temperature,
    },
  };
}

/**
 * Parses the Gemini API response and extracts text content
 * @param {Object} data - The raw API response data
 * @returns {string} - The extracted text content
 * @throws {Error} - If the response format is invalid
 */
function parseGeminiResponse(data) {
  // Check for API-level errors
  if (data.error) {
    const errorMessage = data.error.message || JSON.stringify(data.error);
    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  // Check for prompt feedback (content filtering)
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
  }

  // Validate candidates exist
  if (!data.candidates || data.candidates.length === 0) {
    console.error('[Browser Wand] No candidates in response:', data);
    throw new Error('No response generated from AI');
  }

  const candidate = data.candidates[0];

  // Check for finish reason issues
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    const reason = candidate.finishReason;
    if (reason === 'SAFETY') {
      throw new Error('Response blocked due to safety filters');
    }
    if (reason === 'MAX_TOKENS') {
      console.warn('[Browser Wand] Response truncated due to max tokens');
    }
    if (reason === 'RECITATION') {
      throw new Error('Response blocked due to recitation concerns');
    }
  }

  // Extract content from candidate
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('[Browser Wand] Invalid candidate structure:', candidate);
    throw new Error('Invalid response structure from AI');
  }

  // Concatenate all text parts
  const textParts = candidate.content.parts
    .filter((part) => part.text !== undefined)
    .map((part) => part.text);

  if (textParts.length === 0) {
    throw new Error('No text content in AI response');
  }

  return textParts.join('');
}

/**
 * Calls the Gemini LLM API with the given prompts
 * @param {string} apiKey - The API key for authentication
 * @param {string} systemPrompt - The system prompt
 * @param {string} userMessage - The user message
 * @returns {Promise<string>} - The LLM response content
 */
export async function callLLM(apiKey, systemPrompt, userMessage) {
  const apiUrl = buildApiUrl(apiKey);

  console.log('[Browser Wand] LLM Request:', {
    model: API_CONFIG.model,
    systemPromptLength: systemPrompt.length,
    userMessageLength: userMessage.length,
  });

  const requestBody = buildRequestBody(systemPrompt, userMessage);

  let response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (fetchError) {
    console.error('[Browser Wand] LLM Fetch Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[Browser Wand] LLM Response Status:', response.status, response.statusText);

  // Handle HTTP errors
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        errorMessage = `API error: ${errorData.error.message}`;
      }
    } catch {
      errorMessage = `API request failed: ${response.status} - ${errorText}`;
    }

    console.error('[Browser Wand] LLM API Error:', { status: response.status, errorText });
    throw new Error(errorMessage);
  }

  const data = await response.json();

  console.log('[Browser Wand] LLM Response Data:', {
    hasCandidates: !!data.candidates,
    candidatesCount: data.candidates?.length || 0,
    finishReason: data.candidates?.[0]?.finishReason,
    promptFeedback: data.promptFeedback,
    usageMetadata: data.usageMetadata,
  });

  const result = parseGeminiResponse(data);

  console.log(
    '[Browser Wand] LLM Response Content (truncated):',
    result.substring(0, 500) + (result.length > 500 ? '...' : '')
  );

  return result;
}

/**
 * Parses the modification response from the LLM
 * Handles both raw JSON and markdown-wrapped JSON
 * @param {string} response - The raw LLM response
 * @returns {Object} - Parsed modification data with code, css, and explanation
 */
export function parseModificationResponse(response) {
  let jsonStr = response.trim();

  // Try to extract JSON from markdown code block (handles ```json ... ``` format)
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      // Support both 'javascript' and 'code' field names for JavaScript code
      code: parsed.javascript || parsed.code || '',
      css: parsed.css || '',
      explanation: parsed.explanation || 'Modifications applied.',
    };
  } catch {
    // If JSON parsing fails, return the raw response as explanation
    return {
      code: '',
      css: '',
      explanation: response,
    };
  }
}

/**
 * Translates text blocks in batches using chunked LLM calls
 * @param {string} apiKey - API key for authentication
 * @param {string[]} textBlocks - Array of text blocks to translate
 * @param {string} targetLanguage - Target language for translation
 * @returns {Promise<string[]>} - Array of translated text blocks
 */
export async function translateInChunks(apiKey, textBlocks, targetLanguage) {
  const batchSize = CHUNKING_CONFIG.translationBatchSize;
  const allTranslations = [];

  for (let i = 0; i < textBlocks.length; i += batchSize) {
    const batch = textBlocks.slice(i, i + batchSize);

    const systemPrompt = `You are a professional translator. Translate the following text blocks to ${targetLanguage}.

CRITICAL RULES:
1. Maintain the original meaning and tone
2. Keep proper nouns and technical terms appropriately
3. Return ONLY a valid JSON array of translated strings - NO other text, NO explanations, NO markdown
4. Each translation must correspond to the input text block at the same index
5. The number of translations MUST equal the number of input texts (${batch.length} items)
6. Start your response with [ and end with ]

REQUIRED OUTPUT FORMAT (exactly like this):
["translation 1", "translation 2", "translation 3"]`;

    const userMessage = `Translate these ${batch.length} text blocks to ${targetLanguage}. Return ONLY a JSON array with exactly ${batch.length} translated strings:

${JSON.stringify(batch)}`;

    try {
      const response = await callLLM(apiKey, systemPrompt, userMessage);
      const translations = parseTranslationResponse(response, batch.length);
      allTranslations.push(...translations);
    } catch (error) {
      console.error(`Translation batch ${i / batchSize + 1} failed:`, error);
      allTranslations.push(...batch.map(() => '[Translation unavailable]'));
    }
  }

  return allTranslations;
}

/**
 * Parses translation response from LLM
 * Handles multiple response formats: JSON array, numbered list, or formatted text
 * @param {string} response - The raw LLM response
 * @param {number} expectedCount - Expected number of translations
 * @returns {string[]} - Array of translated strings
 */
function parseTranslationResponse(response, expectedCount) {
  // Clean response - remove markdown code block wrappers if present
  let cleanedResponse = response.trim();
  const codeBlockMatch = cleanedResponse.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleanedResponse = codeBlockMatch[1].trim();
  }

  // First, try to parse as JSON array
  try {
    // Try direct parsing first (most common case when LLM follows instructions)
    const directParsed = JSON.parse(cleanedResponse);
    if (Array.isArray(directParsed) && directParsed.length > 0) {
      console.log('[Browser Wand] parseTranslationResponse: Parsed as direct JSON array');
      return directParsed.map((item) => String(item));
    }
  } catch {
    // Direct parsing failed, try to extract JSON array from mixed content
  }

  // Try to extract JSON array from response (handles mixed text + JSON)
  try {
    // Use non-greedy match to find the first complete JSON array
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('[Browser Wand] parseTranslationResponse: Extracted JSON array from response');
        return parsed.map((item) => String(item));
      }
    }
  } catch {
    // JSON extraction failed, try other formats
  }

  // Try to parse numbered list format (e.g., "1. Translation" or "1) Translation")
  const translations = [];
  const lines = cleanedResponse.split('\n');
  const numberedItemRegex = /^\s*(\d+)[.)]\s*(.+)/;

  for (const line of lines) {
    const match = line.match(numberedItemRegex);
    if (match) {
      let content = match[2].trim();
      // Remove markdown bold wrapper if present (e.g., "**translation**")
      const boldMatch = content.match(/^\*\*(.+?)\*\*$/);
      if (boldMatch) {
        content = boldMatch[1];
      }
      // Remove quotes if the entire content is quoted
      const quotedMatch = content.match(/^["'](.+)["']$/);
      if (quotedMatch) {
        content = quotedMatch[1];
      }
      if (content) {
        translations.push(content);
      }
    }
  }

  if (translations.length > 0) {
    console.log(
      '[Browser Wand] parseTranslationResponse: Parsed',
      translations.length,
      'items from numbered list format'
    );
    return translations;
  }

  // Last resort: try to split by newlines and filter meaningful content
  const lineBasedTranslations = cleanedResponse
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('```'));

  if (lineBasedTranslations.length >= expectedCount) {
    console.log(
      '[Browser Wand] parseTranslationResponse: Using line-based parsing, found',
      lineBasedTranslations.length,
      'lines'
    );
    return lineBasedTranslations.slice(0, expectedCount);
  }

  console.warn('[Browser Wand] parseTranslationResponse: Failed to parse response, returning unavailable');
  console.warn('[Browser Wand] Raw response was:', cleanedResponse.substring(0, 500));
  return Array(expectedCount).fill('[Translation unavailable]');
}


/**
 * Summarizes content in chunks for large pages
 * @param {string} apiKey - API key for authentication
 * @param {string} markdownContent - The markdown content to summarize
 * @param {string} userPrompt - Original user prompt for context
 * @returns {Promise<string>} - The combined summary
 */
export async function summarizeInChunks(apiKey, markdownContent, userPrompt) {
  const maxChunkSize = CHUNKING_CONFIG.maxChunkSize;

  if (markdownContent.length <= maxChunkSize) {
    return await summarizeSingleChunk(apiKey, markdownContent, userPrompt);
  }

  const chunks = splitContentIntoChunks(markdownContent, maxChunkSize);
  const maxChunks = Math.min(chunks.length, CHUNKING_CONFIG.maxChunksPerRequest);

  const chunkSummaries = [];

  for (let i = 0; i < maxChunks; i++) {
    const chunkSummary = await summarizeSingleChunk(
      apiKey,
      chunks[i],
      `Summarize this section (part ${i + 1} of ${maxChunks}):`
    );
    chunkSummaries.push(chunkSummary);
  }

  if (chunkSummaries.length === 1) {
    return chunkSummaries[0];
  }

  const combinedSummary = await combineSummaries(apiKey, chunkSummaries, userPrompt);
  return combinedSummary;
}

/**
 * Strips markdown code block wrappers from LLM response
 * Handles formats like ```json...```, ```...```, etc.
 * @param {string} text - The raw text that may contain code blocks
 * @returns {string} - Clean text without code block wrappers
 */
function stripCodeBlockWrapper(text) {
  if (!text) return text;
  const trimmed = text.trim();
  // Match ```lang\n...``` or ```\n...``` patterns
  const codeBlockMatch = trimmed.match(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

/**
 * Summarizes a single chunk of content
 * @param {string} apiKey - API key for authentication
 * @param {string} content - Content to summarize
 * @param {string} prompt - User prompt
 * @returns {Promise<string>} - Summary text
 */
async function summarizeSingleChunk(apiKey, content, prompt) {
  const systemPrompt = `You are an expert content summarizer. Create concise, informative summaries that capture the key points and main ideas.

RULES:
1. Focus on the main ideas and key takeaways
2. Use clear, concise language
3. Organize information logically
4. Preserve important facts, figures, and conclusions
5. Keep the summary proportional to the content length (aim for 10-20% of original length)
6. Return plain text only - do NOT wrap your response in code blocks or markdown formatting`;

  const userMessage = `${prompt}

CONTENT:
${content}

Provide a clear, well-structured summary:`;

  const response = await callLLM(apiKey, systemPrompt, userMessage);
  return stripCodeBlockWrapper(response);
}

/**
 * Combines multiple chunk summaries into a final summary
 * @param {string} apiKey - API key for authentication
 * @param {string[]} summaries - Array of chunk summaries
 * @param {string} userPrompt - Original user prompt
 * @returns {Promise<string>} - Combined final summary
 */
async function combineSummaries(apiKey, summaries, userPrompt) {
  const systemPrompt = `You are an expert content summarizer. Combine the following section summaries into one coherent, comprehensive summary.

RULES:
1. Merge overlapping information
2. Maintain logical flow and structure
3. Remove redundancies
4. Ensure the final summary is comprehensive but concise
5. Use bullet points or numbered lists where appropriate
6. Return plain text only - do NOT wrap your response in code blocks or markdown formatting`;

  const userMessage = `Original request: ${userPrompt}

SECTION SUMMARIES:
${summaries.map((s, i) => `--- Section ${i + 1} ---\n${s}`).join('\n\n')}

Create a unified, comprehensive summary:`;

  const response = await callLLM(apiKey, systemPrompt, userMessage);
  return stripCodeBlockWrapper(response);
}

/**
 * Splits content into chunks at natural boundaries
 * @param {string} content - Content to split
 * @param {number} maxSize - Maximum chunk size
 * @returns {string[]} - Array of content chunks
 */
function splitContentIntoChunks(content, maxSize) {
  if (content.length <= maxSize) {
    return [content];
  }

  const chunks = [];
  let startIndex = 0;
  const overlap = CHUNKING_CONFIG.chunkOverlap;

  while (startIndex < content.length) {
    let endIndex = startIndex + maxSize;

    if (endIndex < content.length) {
      const headingMatch = content.substring(startIndex, endIndex).lastIndexOf('\n#');
      if (headingMatch > maxSize / 2) {
        endIndex = startIndex + headingMatch;
      } else {
        const paragraphEnd = content.lastIndexOf('\n\n', endIndex);
        if (paragraphEnd > startIndex + maxSize / 2) {
          endIndex = paragraphEnd;
        } else {
          const sentenceEnd = content.lastIndexOf('. ', endIndex);
          if (sentenceEnd > startIndex + maxSize / 2) {
            endIndex = sentenceEnd + 1;
          }
        }
      }
    }

    chunks.push(content.substring(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;

    if (startIndex < 0) startIndex = 0;
    if (endIndex >= content.length) break;
  }

  return chunks;
}
