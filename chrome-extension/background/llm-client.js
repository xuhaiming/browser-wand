/**
 * LLM API client module
 * Handles communication with the official Gemini API
 */

import { API_CONFIG, CHUNKING_CONFIG, IMAGE_GENERATION_CONFIG } from './config.js';

/**
 * Builds the Gemini API URL with the API key
 * @param {string} apiKey - The API key for authentication
 * @param {string} model - The model ID to use
 * @returns {string} - The complete API URL
 */
function buildApiUrl(apiKey, model) {
  const modelId = model || API_CONFIG.model;
  return `${API_CONFIG.baseUrl}/models/${modelId}:generateContent?key=${apiKey}`;
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
 * @param {string} [model] - Optional model ID to use (defaults to API_CONFIG.model)
 * @returns {Promise<string>} - The LLM response content
 */
export async function callLLM(apiKey, systemPrompt, userMessage, model) {
  const modelId = model || API_CONFIG.model;
  const apiUrl = buildApiUrl(apiKey, modelId);

  console.log('[Browser Wand] LLM Request:', {
    model: modelId,
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
 * Also handles truncated JSON by attempting to repair it
 * @param {string} response - The raw LLM response
 * @returns {Object} - Parsed modification data with code, css, and explanation
 */
export function parseModificationResponse(response) {
  let jsonStr = response.trim();

  // Try to extract JSON from markdown code block (handles ```json ... ``` format)
  // Use greedy match to capture the entire JSON block
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
    // If there are multiple code blocks, take the content up to the first closing ```
    // by finding the actual JSON object boundaries
    const endOfJson = findJsonEndIndex(jsonStr);
    if (endOfJson !== -1) {
      jsonStr = jsonStr.substring(0, endOfJson);
    }
  }

  // Try to find JSON object if still not valid JSON
  if (!jsonStr.startsWith('{')) {
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonStr = jsonObjectMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      // Support both 'javascript' and 'code' field names for JavaScript code
      code: parsed.javascript || parsed.code || '',
      css: parsed.css || '',
      explanation: parsed.explanation || 'Modifications applied.',
    };
  } catch (error) {
    console.error('[Browser Wand] parseModificationResponse: JSON parse failed:', error.message);
    console.error('[Browser Wand] parseModificationResponse: Raw response (first 500 chars):', response.substring(0, 500));

    // Try to repair truncated JSON by extracting what we can
    const repaired = repairTruncatedModificationJson(jsonStr);
    if (repaired.code || repaired.css) {
      console.log('[Browser Wand] parseModificationResponse: Successfully repaired truncated JSON');
      return repaired;
    }

    // If repair failed, return the raw response as explanation
    return {
      code: '',
      css: '',
      explanation: response,
    };
  }
}

/**
 * Attempts to repair truncated modification JSON by extracting code and css fields
 * @param {string} truncatedJson - The truncated JSON string
 * @returns {Object} - Best-effort parsed result with code, css, and explanation
 */
function repairTruncatedModificationJson(truncatedJson) {
  let code = '';
  let css = '';
  let explanation = 'Modifications applied (recovered from truncated response).';

  // Try to extract code field (handles both "code" and "javascript" field names)
  // The code is typically a function wrapped in a string, so we need to handle escaped characters
  const codePatterns = [
    /"(?:code|javascript)"\s*:\s*"((?:[^"\\]|\\.)*)"/s,
    /"(?:code|javascript)"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*,\s*"css"|"\s*\}|$)/,
  ];

  for (const pattern of codePatterns) {
    const codeMatch = truncatedJson.match(pattern);
    if (codeMatch && codeMatch[1]) {
      try {
        // The code is JSON-escaped, so we need to unescape it
        code = JSON.parse(`"${codeMatch[1]}"`);
        break;
      } catch {
        // Try simple unescaping
        code = codeMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        break;
      }
    }
  }

  // Try to extract css field
  const cssMatch = truncatedJson.match(/"css"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (cssMatch && cssMatch[1]) {
    try {
      css = JSON.parse(`"${cssMatch[1]}"`);
    } catch {
      css = cssMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  // Try to extract explanation field
  const explanationMatch = truncatedJson.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (explanationMatch && explanationMatch[1]) {
    try {
      explanation = JSON.parse(`"${explanationMatch[1]}"`);
    } catch {
      explanation = explanationMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
  }

  console.log('[Browser Wand] repairTruncatedModificationJson: Recovered', {
    codeLength: code.length,
    cssLength: css.length,
    hasExplanation: explanation.length > 0,
  });

  return { code, css, explanation };
}

/**
 * Finds the end index of a JSON object in a string
 * Handles nested braces properly
 * @param {string} str - String containing JSON
 * @returns {number} - End index of JSON object, or -1 if not found
 */
function findJsonEndIndex(str) {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return i + 1;
        }
      }
    }
  }

  return -1;
}

/**
 * Translates text blocks in batches using chunked LLM calls
 * @param {string} apiKey - API key for authentication
 * @param {string[]} textBlocks - Array of text blocks to translate
 * @param {string} targetLanguage - Target language for translation
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<string[]>} - Array of translated text blocks
 */
export async function translateInChunks(apiKey, textBlocks, targetLanguage, model) {
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
      const response = await callLLM(apiKey, systemPrompt, userMessage, model);
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
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<string>} - The combined summary
 */
export async function summarizeInChunks(apiKey, markdownContent, userPrompt, model) {
  const maxChunkSize = CHUNKING_CONFIG.maxChunkSize;

  if (markdownContent.length <= maxChunkSize) {
    return await summarizeSingleChunk(apiKey, markdownContent, userPrompt, model);
  }

  const chunks = splitContentIntoChunks(markdownContent, maxChunkSize);
  const maxChunks = Math.min(chunks.length, CHUNKING_CONFIG.maxChunksPerRequest);

  const chunkSummaries = [];

  for (let i = 0; i < maxChunks; i++) {
    const chunkSummary = await summarizeSingleChunk(
      apiKey,
      chunks[i],
      `Summarize this section (part ${i + 1} of ${maxChunks}):`,
      model
    );
    chunkSummaries.push(chunkSummary);
  }

  if (chunkSummaries.length === 1) {
    return chunkSummaries[0];
  }

  const combinedSummary = await combineSummaries(apiKey, chunkSummaries, userPrompt, model);
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
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<string>} - Summary text
 */
async function summarizeSingleChunk(apiKey, content, prompt, model) {
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

  const response = await callLLM(apiKey, systemPrompt, userMessage, model);
  return stripCodeBlockWrapper(response);
}

/**
 * Combines multiple chunk summaries into a final summary
 * @param {string} apiKey - API key for authentication
 * @param {string[]} summaries - Array of chunk summaries
 * @param {string} userPrompt - Original user prompt
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<string>} - Combined final summary
 */
async function combineSummaries(apiKey, summaries, userPrompt, model) {
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

  const response = await callLLM(apiKey, systemPrompt, userMessage, model);
  return stripCodeBlockWrapper(response);
}

/**
 * Performs a Magic Bar search using Gemini API with Google Search grounding
 * This is a universal search feature that can search for any information online
 * @param {string} apiKey - API key for authentication
 * @param {string} searchQuery - The search query from user
 * @param {Object} context - Optional context from current page
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Search results with answer and sources
 */
export async function magicBarSearch(apiKey, searchQuery, context, model) {
  const modelId = model || API_CONFIG.model;
  const apiUrl = `${API_CONFIG.baseUrl}/models/${modelId}:generateContent?key=${apiKey}`;

  console.log('[Browser Wand] magicBarSearch: Query:', searchQuery);

  // Detect if this is a product search
  const isProductSearch = detectProductSearchIntent(searchQuery);
  console.log('[Browser Wand] magicBarSearch: Is product search:', isProductSearch);

  let systemPrompt;
  let userMessage;

  if (isProductSearch) {
    systemPrompt = `You are a product research assistant using Google Search to find products and prices.

YOUR TASK:
Search for products based on the user's query and extract information from the search results.

CRITICAL INSTRUCTIONS:
1. Search for products across e-commerce sites (Amazon, eBay, Walmart, Target, AliExpress, Lazada, Shopee, etc.)
2. For EACH product found in search results, extract:
   - title: The exact product name as shown in the search result
   - price: The price WITH currency symbol exactly as shown (e.g., "$29.99", "RM 99.00", "£45.00")
   - source: The website name
   - description: Brief description if available
3. Prices often appear in search snippets - ALWAYS include them when visible
4. Return 5-10 products maximum

RESPONSE FORMAT (JSON):
{
  "type": "products",
  "summary": "Brief summary of what was found",
  "results": [
    {"title": "Product Name", "price": "$XX.XX", "source": "Amazon", "description": "Brief description"}
  ]
}

If a price is not visible, use empty string "" for price field.`;

    userMessage = `Search for: ${searchQuery}
${context?.url ? `Current page: ${context.url}` : ''}
${context?.productName ? `Related to product: ${context.productName}` : ''}

Find products with prices from search results.`;

  } else {
    systemPrompt = `You are a helpful research assistant using Google Search to find accurate, up-to-date information.

YOUR TASK:
Search the web and provide a comprehensive answer to the user's query.

CRITICAL INSTRUCTIONS:
1. Use Google Search to find current, accurate information
2. Synthesize information from multiple sources into a clear, well-structured answer
3. Include relevant facts, data, and insights from the search results
4. Cite sources when providing specific information
5. If the query is about recent events, prioritize recent sources
6. Be factual and objective - don't speculate

RESPONSE FORMAT (JSON):
{
  "type": "information",
  "summary": "A clear, comprehensive answer to the query (2-4 paragraphs)",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "sources": [
    {"title": "Source title", "url": "URL if available", "snippet": "Relevant excerpt"}
  ]
}`;

    userMessage = `Search query: ${searchQuery}
${context?.url ? `Context from current page: ${context.url}` : ''}
${context?.pageTitle ? `Page title: ${context.pageTitle}` : ''}
${context?.selectedText ? `Selected text: ${context.selectedText}` : ''}

Please search for this information and provide a comprehensive answer.`;
  }

  // Use higher token limit for Magic Bar to avoid truncation of search results
  const magicBarMaxTokens = Math.max(API_CONFIG.maxOutputTokens, 8192);

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      maxOutputTokens: magicBarMaxTokens,
      temperature: 0.5,
    },
  };

  console.log('[Browser Wand] magicBarSearch: Calling Gemini API with Google Search grounding...');

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
    console.error('[Browser Wand] magicBarSearch Fetch Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[Browser Wand] magicBarSearch Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Browser Wand] magicBarSearch API Error:', errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Browser Wand] magicBarSearch: Response received');

  // Parse the response based on search type
  const result = parseMagicBarResponse(data, isProductSearch);

  console.log('[Browser Wand] magicBarSearch: Parsed result type:', result.type);
  return result;
}

/**
 * Detects if the search query is looking for news/current events with timeline intent
 * @param {string} query - The search query
 * @returns {boolean} - True if news timeline search intent
 */
export function detectNewsTimelineIntent(query) {
  const newsPatterns = [
    /(?:find|search|get|show)\s+(?:me\s+)?(?:the\s+)?(?:latest|recent|current|new)\s+(?:news|information|updates?|articles?)/i,
    /(?:find|search|get|show)\s+(?:me\s+)?(?:\w+\s+)?(?:news|articles?|stories?|posts?|updates?)\s+(?:about|on|for|related)/i,
    /(?:find|search|get|show)\s+(?:me\s+)?(?:relevant|related|similar|more)\s+(?:news|articles?|stories?|information|content)/i,
    /(?:news|updates?)\s+(?:background|history|timeline|evolution|development)/i,
    /(?:background|history|timeline|context)\s+(?:of|on|about|for)/i,
    /(?:what|how)\s+(?:is|are|was|were|happened)/i,
    /(?:timeline|chronolog|history)\s+(?:of|about|for)/i,
  ];

  const newsKeywords = [
    'relevant news',
    'related news',
    'similar news',
    'more news',
    'find news',
    'related articles',
    'similar articles',
    'news about',
    'news on',
    'current events',
    'latest news',
    'recent news',
    'background',
    'timeline',
    'history of',
    'evolution of',
    'development of',
  ];

  const lowerQuery = query.toLowerCase();

  // Check patterns
  for (const pattern of newsPatterns) {
    if (pattern.test(lowerQuery)) {
      return true;
    }
  }

  // Check keywords
  for (const keyword of newsKeywords) {
    if (lowerQuery.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Performs a news timeline search using Gemini API with Google Search grounding
 * Searches for current news background and returns events in timeline format
 * @param {string} apiKey - API key for authentication
 * @param {string} searchQuery - The search query from user
 * @param {Object} context - Optional context from current page
 * @param {string} [model] - Optional model ID to use
 * @returns {Promise<Object>} - Search results with timeline events and background summary
 */
export async function newsTimelineSearch(apiKey, searchQuery, context, model) {
  const modelId = model || API_CONFIG.model;
  const apiUrl = `${API_CONFIG.baseUrl}/models/${modelId}:generateContent?key=${apiKey}`;

  console.log('[Browser Wand] newsTimelineSearch: Query:', searchQuery);

  const systemPrompt = `You are a news research assistant using Google Search to find current news, background information, and historical context.

YOUR TASK:
Search the web for news and background information about the topic. Provide a comprehensive timeline of events and developments.

CRITICAL INSTRUCTIONS:
1. Use Google Search to find the most recent and relevant news articles
2. Research the background and history of the topic
3. Create a chronological timeline of key events and developments
4. For EACH event, include:
   - date: The date or time period (e.g., "January 2024", "2 days ago", "Yesterday")
   - title: A concise headline describing the event
   - description: A brief explanation (1-2 sentences)
   - source: The source name
   - url: The source URL if available
   - importance: "high", "medium", or "low" based on significance
5. Include both recent news and relevant historical context
6. Sort events chronologically from most recent to oldest
7. Provide a brief background summary at the beginning

RESPONSE FORMAT (JSON):
{
  "type": "news_timeline",
  "topic": "The main topic being researched",
  "backgroundSummary": "A 2-3 paragraph summary providing context and background on the topic",
  "currentStatus": "A brief summary of the current situation or latest developments",
  "timeline": [
    {
      "date": "January 10, 2024",
      "title": "Event headline",
      "description": "Brief description of what happened",
      "source": "Source name",
      "url": "https://...",
      "importance": "high"
    }
  ],
  "sources": [
    {"title": "Source title", "url": "URL"}
  ]
}

Aim for 5-10 timeline events covering both recent developments and relevant history.`;

  const userMessage = `Research the following topic and provide a news timeline with background:

Query: ${searchQuery}
${context?.url ? `Context from current page: ${context.url}` : ''}
${context?.pageTitle ? `Page title: ${context.pageTitle}` : ''}
${context?.selectedText ? `Selected text: ${context.selectedText}` : ''}

Please search for current news and background information, then create a comprehensive timeline.`;

  const magicBarMaxTokens = Math.max(API_CONFIG.maxOutputTokens, 8192);

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      maxOutputTokens: magicBarMaxTokens,
      temperature: 0.5,
    },
  };

  console.log('[Browser Wand] newsTimelineSearch: Calling Gemini API with Google Search grounding...');

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
    console.error('[Browser Wand] newsTimelineSearch Fetch Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[Browser Wand] newsTimelineSearch Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Browser Wand] newsTimelineSearch API Error:', errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Browser Wand] newsTimelineSearch: Response received');

  return parseNewsTimelineResponse(data);
}

/**
 * Parses news timeline response from Gemini API
 * @param {Object} data - Full Gemini API response
 * @returns {Object} - Parsed timeline result
 */
function parseNewsTimelineResponse(data) {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.warn('[Browser Wand] parseNewsTimelineResponse: No candidates in response');
    return {
      type: 'news_timeline',
      topic: '',
      backgroundSummary: 'No results found',
      currentStatus: '',
      timeline: [],
      sources: [],
    };
  }

  // Extract grounding metadata for URLs
  const groundingMetadata = candidate.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks || [];

  console.log('[Browser Wand] parseNewsTimelineResponse: Grounding chunks:', groundingChunks.length);

  // Extract text content from LLM response
  const textParts = candidate.content?.parts?.filter((part) => part.text)?.map((part) => part.text) || [];
  const textContent = textParts.join('');

  console.log('[Browser Wand] parseNewsTimelineResponse: LLM response:', textContent.substring(0, 500));

  let parsedResult;
  try {
    let cleanedResponse = textContent.trim();

    // Remove markdown code block wrapper if present
    const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    // Find the start of JSON object
    const jsonStartIndex = cleanedResponse.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error('No JSON object found');
    }

    const jsonPart = cleanedResponse.substring(jsonStartIndex);
    const jsonEndIndex = findJsonEndIndex(jsonPart);

    if (jsonEndIndex !== -1) {
      const jsonStr = jsonPart.substring(0, jsonEndIndex);
      parsedResult = JSON.parse(jsonStr);
    } else {
      console.warn('[Browser Wand] parseNewsTimelineResponse: JSON appears truncated, attempting repair');
      parsedResult = repairTruncatedNewsJson(jsonPart);
    }
  } catch (e) {
    console.warn('[Browser Wand] parseNewsTimelineResponse: Failed to parse JSON:', e.message);
    parsedResult = {
      type: 'news_timeline',
      topic: '',
      backgroundSummary: textContent || 'Search completed. Results may be incomplete.',
      currentStatus: '',
      timeline: [],
      sources: [],
    };
  }

  // Enrich timeline with grounded URLs
  if (parsedResult.timeline && parsedResult.timeline.length > 0) {
    parsedResult.timeline = enrichTimelineWithGrounding(parsedResult.timeline, groundingChunks);
  }

  // Add grounded sources if not present
  const groundedSources = groundingChunks
    .filter((chunk) => chunk.web?.uri)
    .map((chunk) => ({
      title: chunk.web.title || 'Source',
      url: chunk.web.uri,
    }));

  if (groundedSources.length > 0 && (!parsedResult.sources || parsedResult.sources.length === 0)) {
    parsedResult.sources = groundedSources;
  }

  // Ensure type is set
  parsedResult.type = 'news_timeline';

  return parsedResult;
}

/**
 * Attempts to repair truncated news timeline JSON
 * @param {string} truncatedJson - The truncated JSON string
 * @returns {Object} - Best-effort parsed result
 */
function repairTruncatedNewsJson(truncatedJson) {
  const result = {
    type: 'news_timeline',
    topic: '',
    backgroundSummary: '',
    currentStatus: '',
    timeline: [],
    sources: [],
  };

  // Try to extract topic
  const topicMatch = truncatedJson.match(/"topic"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (topicMatch) {
    result.topic = topicMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }

  // Try to extract backgroundSummary
  const summaryMatch = truncatedJson.match(/"backgroundSummary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (summaryMatch) {
    result.backgroundSummary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }

  // Try to extract currentStatus
  const statusMatch = truncatedJson.match(/"currentStatus"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (statusMatch) {
    result.currentStatus = statusMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }

  // Try to extract timeline events
  const timelineMatch = truncatedJson.match(/"timeline"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
  if (timelineMatch) {
    const timelineStr = timelineMatch[1];
    const eventMatches = timelineStr.match(/\{[^{}]*\}/g);
    if (eventMatches) {
      eventMatches.forEach(eventStr => {
        try {
          const event = JSON.parse(eventStr);
          if (event.title || event.date) {
            result.timeline.push(event);
          }
        } catch {
          // Skip invalid events
        }
      });
    }
  }

  console.log('[Browser Wand] repairTruncatedNewsJson: Recovered', {
    hasTopic: !!result.topic,
    summaryLength: result.backgroundSummary.length,
    timelineCount: result.timeline.length,
  });

  return result;
}

/**
 * Enriches timeline events with URLs from grounding metadata
 * @param {Array} timeline - Timeline events from LLM response
 * @param {Array} groundingChunks - Grounding chunks with URLs
 * @returns {Array} - Timeline events with URLs
 */
function enrichTimelineWithGrounding(timeline, groundingChunks) {
  const urls = groundingChunks
    .filter((chunk) => chunk.web?.uri)
    .map((chunk) => ({
      uri: chunk.web.uri,
      title: chunk.web.title || '',
    }));

  const usedUrls = new Set();

  return timeline.map(event => {
    // If event already has a valid URL, keep it
    if (event.url && event.url.startsWith('http')) {
      return event;
    }

    // Try to find a matching URL from grounding
    for (const urlInfo of urls) {
      if (usedUrls.has(urlInfo.uri)) continue;

      const titleLower = (urlInfo.title || '').toLowerCase();
      const eventTitle = (event.title || '').toLowerCase();

      // Check for title word overlap
      const eventWords = eventTitle.split(/\s+/).filter(w => w.length > 3);
      const matchingWords = eventWords.filter(w => titleLower.includes(w));

      if (matchingWords.length >= 2) {
        usedUrls.add(urlInfo.uri);
        return { ...event, url: urlInfo.uri };
      }
    }

    return event;
  });
}

/**
 * Detects if the search query is looking for products/shopping
 * @param {string} query - The search query
 * @returns {boolean} - True if product search intent
 */
function detectProductSearchIntent(query) {
  const productPatterns = [
    /(?:buy|purchase|shop|order|find|get)\s+(?:a\s+|the\s+)?[\w\s]+(?:online|from|at)/i,
    /(?:similar|related|comparable)\s+(?:products?|items?)/i,
    /(?:compare|comparison)\s+(?:prices?|products?)/i,
    /(?:price|cost|how\s+much)\s+(?:of|for|is)/i,
    /(?:where\s+(?:to|can\s+i))\s+(?:buy|get|find|purchase)/i,
    /(?:best|top|cheap|affordable|budget)\s+[\w\s]+(?:under|for|price)/i,
    /(?:alternatives?|options?|recommendations?)\s+(?:for|to)/i,
    /(?:amazon|ebay|walmart|lazada|shopee|aliexpress|etsy)/i,
  ];

  const lowerQuery = query.toLowerCase();
  return productPatterns.some(pattern => pattern.test(lowerQuery));
}

/**
 * Attempts to repair truncated JSON by extracting what we can from partial data
 * @param {string} truncatedJson - The truncated JSON string
 * @param {boolean} isProductSearch - Whether this is a product search result
 * @returns {Object} - Best-effort parsed result
 */
function repairTruncatedJson(truncatedJson, isProductSearch) {
  // Try to extract type field
  const typeMatch = truncatedJson.match(/"type"\s*:\s*"([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : (isProductSearch ? 'products' : 'information');

  // Try to extract summary field
  const summaryMatch = truncatedJson.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const summary = summaryMatch ? summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';

  // Try to extract key points if present
  const keyPoints = [];
  const keyPointsMatch = truncatedJson.match(/"keyPoints"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
  if (keyPointsMatch) {
    const keyPointsStr = keyPointsMatch[1];
    const pointMatches = keyPointsStr.match(/"((?:[^"\\]|\\.)*)"/g);
    if (pointMatches) {
      pointMatches.forEach(match => {
        const point = match.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
        if (point.trim()) {
          keyPoints.push(point);
        }
      });
    }
  }

  // Try to extract results/products if present
  const results = [];
  const resultsMatch = truncatedJson.match(/"results"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
  if (resultsMatch) {
    // Try to extract individual product objects
    const resultsStr = resultsMatch[1];
    const productMatches = resultsStr.match(/\{[^{}]*\}/g);
    if (productMatches) {
      productMatches.forEach(productStr => {
        try {
          const product = JSON.parse(productStr);
          if (product.title) {
            results.push(product);
          }
        } catch {
          // Skip invalid products
        }
      });
    }
  }

  console.log('[Browser Wand] repairTruncatedJson: Recovered', {
    type,
    summaryLength: summary.length,
    keyPointsCount: keyPoints.length,
    resultsCount: results.length,
  });

  return {
    type,
    summary: summary || 'Search completed. Some results may be incomplete due to response truncation.',
    keyPoints,
    results,
    sources: [],
  };
}

/**
 * Parses Magic Bar response from Gemini API
 * Handles truncated JSON responses gracefully by attempting to extract valid JSON
 * @param {Object} data - Full Gemini API response
 * @param {boolean} isProductSearch - Whether this was a product search
 * @returns {Object} - Parsed search result
 */
function parseMagicBarResponse(data, isProductSearch) {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.warn('[Browser Wand] parseMagicBarResponse: No candidates in response');
    return { type: 'error', summary: 'No results found', results: [], sources: [] };
  }

  // Check for truncation due to max tokens
  const finishReason = candidate.finishReason;
  const wasTruncated = finishReason === 'MAX_TOKENS';
  if (wasTruncated) {
    console.warn('[Browser Wand] parseMagicBarResponse: Response was truncated due to max tokens');
  }

  // Extract grounding metadata for URLs
  const groundingMetadata = candidate.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks || [];

  console.log('[Browser Wand] parseMagicBarResponse: Grounding chunks:', groundingChunks.length);

  // Extract text content from LLM response
  const textParts = candidate.content?.parts?.filter((part) => part.text)?.map((part) => part.text) || [];
  const textContent = textParts.join('');

  console.log('[Browser Wand] parseMagicBarResponse: LLM response:', textContent.substring(0, 500));

  // Try to parse JSON response
  let parsedResult;
  try {
    let cleanedResponse = textContent.trim();

    // Remove markdown code block wrapper if present
    const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    }

    // Find the start of JSON object
    const jsonStartIndex = cleanedResponse.indexOf('{');
    if (jsonStartIndex === -1) {
      throw new Error('No JSON object found');
    }

    // Extract just the JSON part starting from first {
    const jsonPart = cleanedResponse.substring(jsonStartIndex);

    // Use findJsonEndIndex to properly find the end of JSON even if truncated
    const jsonEndIndex = findJsonEndIndex(jsonPart);

    if (jsonEndIndex !== -1) {
      // Found complete JSON object
      const jsonStr = jsonPart.substring(0, jsonEndIndex);
      parsedResult = JSON.parse(jsonStr);
    } else {
      // JSON is truncated - try to repair it
      console.warn('[Browser Wand] parseMagicBarResponse: JSON appears truncated, attempting repair');
      parsedResult = repairTruncatedJson(jsonPart, isProductSearch);
    }
  } catch (e) {
    console.warn('[Browser Wand] parseMagicBarResponse: Failed to parse JSON:', e.message);
    // Fall back to text response - strip any partial JSON and use as summary
    let summaryText = textContent;
    // Remove partial JSON from summary
    const jsonStart = summaryText.indexOf('{');
    if (jsonStart > 0) {
      summaryText = summaryText.substring(0, jsonStart).trim();
    }
    if (!summaryText || summaryText.length < 20) {
      summaryText = 'Search completed. Results may be incomplete due to response truncation.';
    }
    parsedResult = {
      type: 'information',
      summary: summaryText,
      keyPoints: [],
      sources: [],
    };
  }

  // For product searches, enrich results with grounded URLs
  if (isProductSearch && parsedResult.results) {
    parsedResult.results = enrichProductsWithGrounding(parsedResult.results, groundingChunks);
  }

  // For information searches, add grounded sources
  if (!isProductSearch) {
    const groundedSources = groundingChunks
      .filter((chunk) => chunk.web?.uri)
      .map((chunk) => ({
        title: chunk.web.title || 'Source',
        url: chunk.web.uri,
        snippet: '',
      }));

    if (groundedSources.length > 0 && (!parsedResult.sources || parsedResult.sources.length === 0)) {
      parsedResult.sources = groundedSources;
    }
  }

  return parsedResult;
}

/**
 * Enriches product results with URLs from grounding metadata
 * @param {Array} products - Products from LLM response
 * @param {Array} groundingChunks - Grounding chunks with URLs
 * @returns {Array} - Products with URLs
 */
function enrichProductsWithGrounding(products, groundingChunks) {
  // Extract e-commerce URLs from grounding chunks
  const ecommerceUrls = groundingChunks
    .filter((chunk) => chunk.web?.uri)
    .map((chunk) => ({
      uri: chunk.web.uri,
      title: chunk.web.title || '',
      source: extractSourceFromUrl(chunk.web.uri) || extractSourceFromTitle(chunk.web.title),
    }))
    .filter((item) => item.source && item.source !== 'Web');

  const usedUrls = new Set();
  const enrichedProducts = [];

  // Match products with grounded URLs
  for (const product of products) {
    const matchedUrl = findBestUrlMatch(product, ecommerceUrls, usedUrls);

    if (matchedUrl) {
      usedUrls.add(matchedUrl.uri);
      enrichedProducts.push({
        title: product.title,
        price: product.price || '',
        description: product.description || '',
        url: matchedUrl.uri,
        source: product.source || matchedUrl.source,
      });
    } else {
      enrichedProducts.push({
        title: product.title,
        price: product.price || '',
        description: product.description || '',
        url: '',
        source: product.source || '',
      });
    }
  }

  // Add remaining e-commerce URLs
  for (const urlInfo of ecommerceUrls) {
    if (usedUrls.has(urlInfo.uri)) continue;
    if (enrichedProducts.length >= 10) break;

    const priceInTitle = extractPriceFromText(urlInfo.title);

    enrichedProducts.push({
      title: cleanProductTitle(urlInfo.title) || `Product from ${urlInfo.source}`,
      price: priceInTitle || '',
      description: '',
      url: urlInfo.uri,
      source: urlInfo.source,
    });
    usedUrls.add(urlInfo.uri);
  }

  return enrichedProducts.filter((p) => p.title).slice(0, 10);
}

/**
 * @deprecated Use enrichProductsWithGrounding instead
 * Parses product search response with grounding metadata for valid URLs
 * Combines LLM-extracted product info with real URLs from groundingChunks
 * @param {Object} data - Full Gemini API response including groundingMetadata
 * @returns {Array} - Array of product objects with valid URLs and prices
 */
function parseProductSearchWithGrounding(data) {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.warn('[Browser Wand] parseProductSearchWithGrounding: No candidates in response');
    return [];
  }

  // Extract grounding chunks (real URLs from Google Search)
  const groundingMetadata = candidate.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks || [];
  const groundingSupports = groundingMetadata?.groundingSupports || [];
  const webSearchQueries = groundingMetadata?.webSearchQueries || [];

  console.log('[Browser Wand] parseProductSearchWithGrounding:', {
    groundingChunks: groundingChunks.length,
    groundingSupports: groundingSupports.length,
    webSearchQueries,
  });

  // Extract text content from LLM response
  const textParts = candidate.content?.parts?.filter((part) => part.text)?.map((part) => part.text) || [];
  const textContent = textParts.join('');

  console.log('[Browser Wand] parseProductSearchWithGrounding: LLM response text:', textContent.substring(0, 500));

  // Parse products from LLM's JSON response (contains titles, prices, sources)
  let llmProducts = [];
  try {
    llmProducts = parseProductSearchResponse(textContent);
    console.log('[Browser Wand] parseProductSearchWithGrounding: Parsed', llmProducts.length, 'products from LLM');
  } catch (e) {
    console.warn('[Browser Wand] parseProductSearchWithGrounding: Failed to parse LLM products:', e);
  }

  // Extract e-commerce URLs from grounding chunks
  const ecommerceUrls = groundingChunks
    .filter((chunk) => chunk.web?.uri)
    .map((chunk) => ({
      uri: chunk.web.uri,
      title: chunk.web.title || '',
      source: extractSourceFromUrl(chunk.web.uri) || extractSourceFromTitle(chunk.web.title),
    }))
    .filter((item) => item.source && item.source !== 'Web'); // Only keep e-commerce URLs

  console.log('[Browser Wand] parseProductSearchWithGrounding: Found', ecommerceUrls.length, 'e-commerce URLs in grounding');

  // Strategy: Match LLM products with grounded URLs by source/title similarity
  const finalProducts = [];
  const usedUrls = new Set();

  // First pass: Match LLM products with grounding URLs
  for (const product of llmProducts) {
    const matchedUrl = findBestUrlMatch(product, ecommerceUrls, usedUrls);

    if (matchedUrl) {
      usedUrls.add(matchedUrl.uri);
      finalProducts.push({
        title: product.title,
        price: product.price || '',
        description: product.description || '',
        url: matchedUrl.uri,
        source: product.source || matchedUrl.source,
      });
    }
  }

  // Second pass: Add remaining e-commerce URLs that weren't matched
  // These may have price info in the title or be valid product pages
  for (const urlInfo of ecommerceUrls) {
    if (usedUrls.has(urlInfo.uri)) continue;
    if (finalProducts.length >= 10) break;

    // Extract price from title if available
    const priceInTitle = extractPriceFromText(urlInfo.title);

    finalProducts.push({
      title: cleanProductTitle(urlInfo.title) || `Product from ${urlInfo.source}`,
      price: priceInTitle || '',
      description: '',
      url: urlInfo.uri,
      source: urlInfo.source,
    });
    usedUrls.add(urlInfo.uri);
  }

  // Filter to only include products with valid URLs
  const validProducts = finalProducts.filter((p) => p.url && p.url.startsWith('http'));

  console.log('[Browser Wand] parseProductSearchWithGrounding: Final products count:', validProducts.length);
  return validProducts.slice(0, 10);
}

/**
 * Finds the best matching URL for a product based on source and title
 * @param {Object} product - Product from LLM response
 * @param {Array} urls - Available e-commerce URLs
 * @param {Set} usedUrls - URLs already assigned to products
 * @returns {Object|null} - Best matching URL info or null
 */
function findBestUrlMatch(product, urls, usedUrls) {
  const productSource = (product.source || '').toLowerCase();
  const productTitle = (product.title || '').toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const urlInfo of urls) {
    if (usedUrls.has(urlInfo.uri)) continue;

    const urlSource = (urlInfo.source || '').toLowerCase();
    const urlTitle = (urlInfo.title || '').toLowerCase();
    let score = 0;

    // Exact source match is highest priority
    if (productSource && urlSource && productSource === urlSource) {
      score += 10;
    } else if (productSource && urlSource && (productSource.includes(urlSource) || urlSource.includes(productSource))) {
      score += 5;
    }

    // Title word overlap
    if (productTitle && urlTitle) {
      const productWords = productTitle.split(/\s+/).filter((w) => w.length > 3);
      const matchingWords = productWords.filter((w) => urlTitle.includes(w));
      score += matchingWords.length * 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = urlInfo;
    }
  }

  // Require minimum score to avoid bad matches
  return bestScore >= 3 ? bestMatch : null;
}

/**
 * Extracts price from text (title or snippet)
 * @param {string} text - Text to extract price from
 * @returns {string} - Extracted price or empty string
 */
function extractPriceFromText(text) {
  if (!text) return '';

  // Common price patterns
  const patterns = [
    /[$]\s*[\d,]+\.?\d*/,                                    // $29.99
    /[£€¥₹₩₱]\s*[\d,]+\.?\d*/,                               // €29.99, £29.99, etc.
    /(?:RM|SGD|USD|EUR|GBP|AUD|CAD|MYR|THB|PHP|IDR|VND|JPY|CNY|KRW|INR)\s*[\d,]+\.?\d*/i,  // RM 99.00
    /[\d,]+\.?\d*\s*(?:RM|SGD|USD|EUR|GBP|AUD|CAD|MYR|THB|PHP|IDR|VND)/i,  // 99.00 RM
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return '';
}

/**
 * Cleans product title by removing site names and unnecessary text
 * @param {string} title - Raw title from grounding chunk
 * @returns {string} - Cleaned title
 */
function cleanProductTitle(title) {
  if (!title) return '';

  // Remove common suffixes like " - Amazon.com", " | eBay", etc.
  let cleaned = title
    .replace(/\s*[-|–—]\s*(Amazon|eBay|Walmart|Target|Lazada|Shopee|AliExpress|Best Buy|Newegg|Etsy).*$/i, '')
    .replace(/\s*[-|–—]\s*[A-Za-z]+\.(com|co\.[a-z]+|[a-z]+).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim();

  // Limit length
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 150).replace(/\s+\S*$/, '...');
  }

  return cleaned;
}

/**
 * Builds a search query from product info optimized for e-commerce results
 * @param {Object} productInfo - Product information
 * @param {string} userPrompt - User prompt
 * @returns {string} - Search query
 */
function buildProductSearchQuery(productInfo, userPrompt) {
  // Clean and extract meaningful product name
  let productName = productInfo.name || '';

  // Remove common non-product text from titles
  productName = productName
    .replace(/[-|–—].*?(official|store|shop|website|site).*$/gi, '')
    .replace(/\s*[|–—]\s*.*$/, '')
    .replace(/buy\s+online/gi, '')
    .replace(/free\s+shipping/gi, '')
    .replace(/best\s+price/gi, '')
    .trim();

  // Limit product name length for better search results
  if (productName.length > 80) {
    productName = productName.substring(0, 80).replace(/\s+\S*$/, '');
  }

  let query = productName;

  // Extract specific store mentions from user prompt
  const storePatterns = /(?:on|from|at|in)\s+(amazon|lazada|shopee|aliexpress|ebay|walmart|taobao|target|bestbuy|newegg|rakuten|flipkart|mercadolibre)/gi;
  const storeMatches = userPrompt.match(storePatterns);

  if (storeMatches) {
    // User wants specific stores - search with those store names
    const stores = storeMatches.map((m) => m.replace(/^(?:on|from|at|in)\s+/i, ''));
    query += ' ' + stores.join(' OR ');
  } else {
    // Default: search for product with price indicator to get e-commerce results
    query += ' price buy';
  }

  return query;
}

/**
 * Parses the product search response from LLM
 * @param {string} response - Raw LLM response
 * @returns {Array} - Array of product objects
 */
function parseProductSearchResponse(response) {
  // Clean response - remove markdown code block wrappers if present
  let cleanedResponse = response.trim();
  const codeBlockMatch = cleanedResponse.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleanedResponse = codeBlockMatch[1].trim();
  }

  try {
    // Try direct parsing first
    const parsed = JSON.parse(cleanedResponse);
    if (Array.isArray(parsed)) {
      return validateProducts(parsed);
    }
  } catch {
    // Direct parsing failed
  }

  // Try to extract JSON array from response
  try {
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return validateProducts(parsed);
      }
    }
  } catch {
    // JSON extraction failed
  }

  console.warn('[Browser Wand] parseProductSearchResponse: Failed to parse response');
  console.warn('[Browser Wand] Raw response was:', cleanedResponse.substring(0, 500));
  return [];
}

/**
 * Validates and cleans product objects
 * URL is not required as it will be matched from grounding metadata
 * @param {Array} products - Raw product array
 * @returns {Array} - Validated product array
 */
function validateProducts(products) {
  return products
    .filter((p) => p && typeof p === 'object' && p.title)
    .map((p) => ({
      title: String(p.title || '').substring(0, 200),
      price: normalizePrice(p.price),
      description: String(p.description || '').substring(0, 200),
      url: String(p.url || ''),
      source: String(p.source || (p.url ? extractSourceFromUrl(p.url) : '')),
    }))
    .slice(0, 10);
}

/**
 * Normalizes price string to consistent format
 * @param {string} price - Raw price string
 * @returns {string} - Normalized price
 */
function normalizePrice(price) {
  if (!price) return '';
  const priceStr = String(price).trim();

  // Check if it's already a valid price format
  if (/^[$¥€£₹₩₱]?\s*[\d,]+(?:\.\d{2})?$/.test(priceStr)) {
    return priceStr;
  }
  if (/^(?:RM|SGD|USD|EUR|GBP|JPY|CNY|KRW|INR|THB|VND|PHP|IDR|AUD|CAD|NZD)\s*[\d,]+(?:\.\d{2})?$/i.test(priceStr)) {
    return priceStr;
  }

  // Try to extract price from mixed text
  const priceMatch = priceStr.match(/(?:[$¥€£₹₩₱]|RM|SGD|USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?/i);
  if (priceMatch) {
    return priceMatch[0];
  }

  return priceStr;
}

/**
 * E-commerce site patterns for URL detection
 * Maps URL patterns to display names
 */
const ECOMMERCE_PATTERNS = [
  // Global marketplaces
  { pattern: 'amazon', name: 'Amazon' },
  { pattern: 'ebay', name: 'eBay' },
  { pattern: 'aliexpress', name: 'AliExpress' },
  { pattern: 'alibaba', name: 'Alibaba' },
  { pattern: 'etsy', name: 'Etsy' },
  { pattern: 'wish.com', name: 'Wish' },
  // US retailers
  { pattern: 'walmart', name: 'Walmart' },
  { pattern: 'target.com', name: 'Target' },
  { pattern: 'bestbuy', name: 'Best Buy' },
  { pattern: 'costco', name: 'Costco' },
  { pattern: 'homedepot', name: 'Home Depot' },
  { pattern: 'lowes.com', name: "Lowe's" },
  { pattern: 'newegg', name: 'Newegg' },
  { pattern: 'macys', name: "Macy's" },
  { pattern: 'nordstrom', name: 'Nordstrom' },
  { pattern: 'kohls', name: "Kohl's" },
  { pattern: 'samsclub', name: "Sam's Club" },
  { pattern: 'wayfair', name: 'Wayfair' },
  { pattern: 'overstock', name: 'Overstock' },
  // Southeast Asia
  { pattern: 'lazada', name: 'Lazada' },
  { pattern: 'shopee', name: 'Shopee' },
  { pattern: 'tokopedia', name: 'Tokopedia' },
  { pattern: 'bukalapak', name: 'Bukalapak' },
  { pattern: 'blibli', name: 'Blibli' },
  { pattern: 'zalora', name: 'Zalora' },
  // China
  { pattern: 'taobao', name: 'Taobao' },
  { pattern: 'jd.com', name: 'JD.com' },
  { pattern: 'tmall', name: 'Tmall' },
  { pattern: 'pinduoduo', name: 'Pinduoduo' },
  // India
  { pattern: 'flipkart', name: 'Flipkart' },
  { pattern: 'myntra', name: 'Myntra' },
  { pattern: 'snapdeal', name: 'Snapdeal' },
  // Japan/Korea
  { pattern: 'rakuten', name: 'Rakuten' },
  { pattern: 'yahoo.co.jp', name: 'Yahoo Japan' },
  { pattern: 'coupang', name: 'Coupang' },
  { pattern: 'gmarket', name: 'Gmarket' },
  // Europe
  { pattern: 'otto.de', name: 'Otto' },
  { pattern: 'zalando', name: 'Zalando' },
  { pattern: 'bol.com', name: 'Bol.com' },
  { pattern: 'cdiscount', name: 'Cdiscount' },
  { pattern: 'fnac', name: 'Fnac' },
  // Latin America
  { pattern: 'mercadolibre', name: 'MercadoLibre' },
  { pattern: 'mercadolivre', name: 'MercadoLivre' },
  { pattern: 'americanas', name: 'Americanas' },
  // Others
  { pattern: 'asos', name: 'ASOS' },
  { pattern: 'shein', name: 'SHEIN' },
  { pattern: 'temu', name: 'Temu' },
  { pattern: 'banggood', name: 'Banggood' },
  { pattern: 'gearbest', name: 'GearBest' },
  { pattern: 'dhgate', name: 'DHgate' },
];

/**
 * Extracts source/store name from URL
 * @param {string} url - Product URL
 * @returns {string} - Store name
 */
function extractSourceFromUrl(url) {
  if (!url) return 'Web';
  const urlLower = url.toLowerCase();

  for (const site of ECOMMERCE_PATTERNS) {
    if (urlLower.includes(site.pattern)) {
      return site.name;
    }
  }

  return 'Web';
}

/**
 * Extracts source/store name from grounding chunk title
 * The title often contains the website domain like "amazon.com" or "eBay"
 * @param {string} title - Grounding chunk title
 * @returns {string|null} - Store name or null if not detected
 */
function extractSourceFromTitle(title) {
  if (!title) return null;
  const titleLower = title.toLowerCase();

  for (const site of ECOMMERCE_PATTERNS) {
    if (titleLower.includes(site.pattern)) {
      return site.name;
    }
  }

  return null;
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

/**
 * Detects if the query requires image generation
 * @param {string} query - The search/request query
 * @returns {Object} - Detection result with isImageRequest flag and details
 */
export function detectImageGenerationIntent(query) {
  const lowerQuery = query.toLowerCase();

  // Patterns that indicate image generation request
  const imageGenerationPatterns = [
    /(?:create|generate|make|draw|design|produce)\s+(?:an?\s+)?(?:image|picture|photo|illustration|art|artwork|graphic|visual)/i,
    /(?:image|picture|photo|illustration|art|artwork|graphic)\s+(?:of|showing|depicting|with)/i,
    /(?:show|display|give)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration)/i,
    /(?:visualize|illustrate)\s+/i,
    /(?:can\s+you\s+)?(?:create|generate|make|draw)\s+/i,
    /(?:i\s+need|i\s+want)\s+(?:an?\s+)?(?:image|picture|photo|illustration)/i,
  ];

  // Check if query matches image generation patterns
  for (const pattern of imageGenerationPatterns) {
    if (pattern.test(lowerQuery)) {
      return {
        isImageRequest: true,
        prompt: query,
        numberOfImages: detectImageCount(lowerQuery),
        aspectRatio: detectAspectRatio(lowerQuery),
      };
    }
  }

  // Keywords that strongly indicate image generation
  const imageKeywords = [
    'generate image',
    'create image',
    'make image',
    'draw',
    'illustration',
    'picture of',
    'image of',
    'artwork',
    'visualize',
  ];

  for (const keyword of imageKeywords) {
    if (lowerQuery.includes(keyword)) {
      return {
        isImageRequest: true,
        prompt: query,
        numberOfImages: detectImageCount(lowerQuery),
        aspectRatio: detectAspectRatio(lowerQuery),
      };
    }
  }

  return { isImageRequest: false };
}

/**
 * Detects requested number of images from query
 * @param {string} query - The query string
 * @returns {number} - Number of images to generate (1-4)
 */
function detectImageCount(query) {
  const countPatterns = [
    { pattern: /(\d+)\s+(?:images?|pictures?|photos?|illustrations?)/i, group: 1 },
    { pattern: /(?:multiple|several|a\s+few)\s+(?:images?|pictures?)/i, count: 3 },
    { pattern: /(?:two|2)\s+(?:images?|pictures?)/i, count: 2 },
    { pattern: /(?:three|3)\s+(?:images?|pictures?)/i, count: 3 },
    { pattern: /(?:four|4)\s+(?:images?|pictures?)/i, count: 4 },
  ];

  for (const { pattern, group, count } of countPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (group !== undefined) {
        const num = parseInt(match[group], 10);
        return Math.min(Math.max(num, 1), IMAGE_GENERATION_CONFIG.maxImages);
      }
      return count;
    }
  }

  return 1; // Default to 1 image
}

/**
 * Detects requested aspect ratio from query
 * @param {string} query - The query string
 * @returns {string} - Aspect ratio string
 */
function detectAspectRatio(query) {
  const ratioPatterns = [
    { pattern: /(?:landscape|wide|horizontal)/i, ratio: '16:9' },
    { pattern: /(?:portrait|tall|vertical)/i, ratio: '9:16' },
    { pattern: /(?:square)/i, ratio: '1:1' },
    { pattern: /(?:ultrawide|cinematic)/i, ratio: '21:9' },
    { pattern: /(\d+:\d+)/i, group: 1 },
  ];

  for (const { pattern, ratio, group } of ratioPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (group !== undefined) {
        const requestedRatio = match[group];
        if (IMAGE_GENERATION_CONFIG.supportedAspectRatios.includes(requestedRatio)) {
          return requestedRatio;
        }
      }
      return ratio;
    }
  }

  return IMAGE_GENERATION_CONFIG.defaultAspectRatio;
}

/**
 * Generates images using the Nano Banana Pro (Gemini 3 Pro Image Preview) model
 * @param {string} apiKey - API key for authentication
 * @param {string} prompt - The image generation prompt
 * @param {Object} options - Generation options
 * @param {number} options.numberOfImages - Number of images to generate (1-4)
 * @param {string} options.aspectRatio - Aspect ratio (e.g., '1:1', '16:9')
 * @param {string} options.imageSize - Image size ('1K', '2K', '4K')
 * @param {Object} options.context - Page context for contextual generation
 * @returns {Promise<Object>} - Generated images with metadata
 */
export async function generateImages(apiKey, prompt, options = {}) {
  const {
    numberOfImages = 1,
    aspectRatio = IMAGE_GENERATION_CONFIG.defaultAspectRatio,
    imageSize = IMAGE_GENERATION_CONFIG.defaultImageSize,
    context = {},
  } = options;

  const modelId = IMAGE_GENERATION_CONFIG.model;
  const apiUrl = `${API_CONFIG.baseUrl}/models/${modelId}:generateContent?key=${apiKey}`;

  console.log('[Browser Wand] generateImages:', {
    prompt: prompt.substring(0, 100),
    numberOfImages,
    aspectRatio,
    imageSize,
    hasContext: !!context.pageTitle || !!context.url,
  });

  // Build enhanced prompt for better image generation, incorporating page context
  const enhancedPrompt = buildImagePrompt(prompt, numberOfImages, context);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: enhancedPrompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize,
      },
    },
  };

  console.log('[Browser Wand] generateImages: Calling Gemini Image API...');

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
    console.error('[Browser Wand] generateImages Fetch Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[Browser Wand] generateImages Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Browser Wand] generateImages API Error:', errorText);
    throw new Error(`Image generation API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Browser Wand] generateImages: Response received');

  return parseImageGenerationResponse(data, prompt);
}

/**
 * Builds an enhanced prompt for image generation
 * Uses condensed page context to prevent API timeouts
 * @param {string} userPrompt - Original user prompt
 * @param {number} numberOfImages - Number of images requested
 * @param {Object} context - Page context for contextual generation (with majorContent)
 * @returns {string} - Enhanced prompt
 */
function buildImagePrompt(userPrompt, numberOfImages, context = {}) {
  // Clean up the prompt - remove meta instructions
  let cleanPrompt = userPrompt
    .replace(/(?:create|generate|make|draw|design|produce)\s+(?:an?\s+)?(?:image|picture|photo|illustration|art|artwork|graphic|visual)\s+(?:of\s+)?/gi, '')
    .replace(/(?:show|display|give)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration)\s+(?:of\s+)?/gi, '')
    .trim();

  // If prompt became empty, use the original
  if (!cleanPrompt) {
    cleanPrompt = userPrompt;
  }

  // Build context string from page information - use condensed majorContent
  const contextParts = [];
  if (context.pageTitle) {
    contextParts.push(`Page: ${context.pageTitle}`);
  }
  if (context.productName) {
    contextParts.push(`Product: ${context.productName}`);
  }
  // Use majorContent for richer context (already limited in buildSearchContext)
  if (context.majorContent) {
    contextParts.push(`Content: ${context.majorContent}`);
  } else if (context.selectedText) {
    // Fallback to selectedText if majorContent not available
    contextParts.push(`Selected: ${context.selectedText}`);
  }

  // If we have page context and the prompt seems to reference it (e.g., "this", "the page", "it")
  const referencesContext = /\b(?:this|the\s+page|it|here|current|above|shown)\b/i.test(cleanPrompt);
  if (contextParts.length > 0 && referencesContext) {
    cleanPrompt = `Based on context:\n${contextParts.join('\n')}\n\nCreate: ${cleanPrompt}`;
  } else if (contextParts.length > 0) {
    // Even without explicit reference, include context if available
    cleanPrompt = `Context: ${contextParts.join('. ')}.\n\nImage: ${cleanPrompt}`;
  }

  // Add style guidance if not present
  const hasStyleGuidance = /(?:style|realistic|cartoon|artistic|photorealistic|digital art|oil painting|watercolor)/i.test(cleanPrompt);

  if (!hasStyleGuidance) {
    cleanPrompt = `High quality, detailed image of: ${cleanPrompt}`;
  }

  // Request multiple images if needed
  if (numberOfImages > 1) {
    cleanPrompt = `Generate ${numberOfImages} different variations of: ${cleanPrompt}`;
  }

  return cleanPrompt;
}

/**
 * Parses the image generation response from Gemini API
 * @param {Object} data - API response data
 * @param {string} originalPrompt - Original user prompt
 * @returns {Object} - Parsed result with images
 */
function parseImageGenerationResponse(data, originalPrompt) {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.warn('[Browser Wand] parseImageGenerationResponse: No candidates in response');
    return {
      type: 'image_generation',
      success: false,
      error: 'No images generated',
      images: [],
      prompt: originalPrompt,
    };
  }

  const parts = candidate.content?.parts || [];
  const images = [];
  let textContent = '';

  for (const part of parts) {
    if (part.inlineData) {
      // Image data (base64 encoded)
      images.push({
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      });
    } else if (part.text) {
      textContent += part.text;
    }
  }

  console.log('[Browser Wand] parseImageGenerationResponse:', {
    imagesCount: images.length,
    hasText: !!textContent,
  });

  return {
    type: 'image_generation',
    success: images.length > 0,
    images: images,
    description: textContent || `Generated ${images.length} image(s) for: ${originalPrompt}`,
    prompt: originalPrompt,
  };
}
