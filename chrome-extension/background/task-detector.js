/**
 * Task type detection module
 * Analyzes user prompts to determine the appropriate modification strategy
 */

import { TASK_TYPES } from './config.js';

const CONTENT_EXTRACTION_PATTERNS = [
  /only\s+(show|display|keep)\s+(the\s+)?(main\s+)?(article|content|text|story|body)/,
  /just\s+(the\s+)?(main\s+)?(article|content|text|story|body)/,
  /(show|display|keep)\s+only\s+(the\s+)?(main\s+)?(article|content|text|story|body)/,
  /(remove|hide)\s+(everything|all|the\s+rest)\s+(except|but)\s+(the\s+)?(main\s+)?(article|content|text|story)/,
  /reader\s*mode/,
  /reading\s*mode/,
  /clean\s*(view|mode|reading)/,
  /extract\s+(the\s+)?(main\s+)?(article|content|text)/,
  /focus\s+(on\s+)?(the\s+)?(main\s+)?(article|content|text)/,
  /isolate\s+(the\s+)?(main\s+)?(article|content|text)/,
];

const CONTENT_EXTRACTION_KEYWORDS = [
  'main article',
  'main content',
  'article only',
  'content only',
  'only article',
  'only content',
  'just the article',
  'just the content',
  'just the text',
  'only the text',
  'reader mode',
  'reading mode',
  'clean view',
];

const AD_KEYWORDS = ['ad', 'advertisement', 'sponsor', 'promo', 'banner', 'popup', 'modal', 'overlay'];
const COMMENT_KEYWORDS = ['comment', 'discussion', 'disqus', 'reply', 'replies'];
const STYLING_KEYWORDS = ['dark', 'light', 'theme', 'color', 'background', 'font'];
const CONTENT_PROTECTION_KEYWORDS = ['article', 'content', 'main', 'text', 'story'];

const TRANSLATION_PATTERNS = [
  /translat(?:e|ion)\s+(?:to|into|in)\s+(\w+)/i,
  /(?:show|add|display|put)\s+(?:the\s+)?(\w+)\s+translation/i,
  /(\w+)\s+translation\s+(?:beside|next\s+to|alongside|side\s+by\s+side)/i,
  /side\s*(?:by|[-])\s*side\s+translation/i,
  /bilingual\s+(?:mode|view|display)/i,
  /(?:add|show|display)\s+(?:parallel|dual)\s+(?:text|translation)/i,
];

const SUMMARIZE_PATTERNS = [
  /summar(?:y|ize|ise)/i,
  /(?:give|provide|show|create|generate)\s+(?:me\s+)?(?:a\s+)?(?:brief\s+)?summary/i,
  /(?:tl;?dr|tldr)/i,
  /(?:main|key)\s+(?:points|takeaways|highlights)/i,
  /(?:brief|short|quick)\s+(?:overview|recap)/i,
  /what(?:'s|\s+is)\s+(?:this|the)\s+(?:article|page|post)\s+about/i,
  /(?:condense|shorten|compress)\s+(?:this|the)\s+(?:article|content|text)/i,
];

// Patterns that indicate user wants content added/inserted INTO the page (not in popup)
const INSERT_INTO_PAGE_PATTERNS = [
  /(?:add|insert|put|place|display|show)\s+.*?(?:on\s+top|at\s+the\s+top|at\s+top|on\s+the\s+top|above|before|beginning)/i,
  /(?:on\s+top|at\s+the\s+top|at\s+top|on\s+the\s+top)\s+of\s+(?:the\s+)?(?:page|content|article)/i,
  /(?:add|insert|put|place)\s+.*?(?:to|into|in)\s+(?:the\s+)?(?:page|content|article)/i,
];

const SUMMARIZE_KEYWORDS = [
  'summarize',
  'summarise',
  'summary',
  'tldr',
  'tl;dr',
  'main points',
  'key points',
  'key takeaways',
  'highlights',
  'overview',
  'recap',
  'gist',
  'essence',
  'digest',
];

const ANALYZE_PATTERNS = [
  /(?:analyze|analyse)\s+(?:this|the)\s+(?:page|content|site|website)/i,
  /(?:what|how\s+many|count|list|find|tell\s+me)\s+(?:are|is|the|all)\s+/i,
  /(?:explain|describe)\s+(?:this|the|what)/i,
  /(?:what|which)\s+(?:elements?|links?|buttons?|images?|headings?|sections?)/i,
  /(?:how|what)\s+does\s+(?:this|the)/i,
  /(?:can\s+you|could\s+you)\s+(?:tell|explain|describe|analyze|analyse)/i,
];

const ANALYZE_KEYWORDS = [
  'analyze',
  'analyse',
  'analysis',
  'what is',
  'what are',
  'how many',
  'count the',
  'list all',
  'find all',
  'explain the',
  'describe the',
  'tell me about',
  'what does',
  'how does',
];

const TRANSLATION_KEYWORDS = [
  'translate', 'translation', 'bilingual', 'dual language', 'parallel text',
  'side by side', 'alongside', 'beside the text', 'next to the text',
];

const SUPPORTED_LANGUAGES = [
  'chinese', 'mandarin', 'cantonese', 'simplified chinese', 'traditional chinese',
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'japanese', 'korean', 'russian', 'arabic', 'hindi', 'thai', 'vietnamese',
  'indonesian', 'malay', 'dutch', 'polish', 'turkish', 'hebrew', 'greek',
];

/**
 * Checks if the prompt matches content extraction patterns
 */
function isContentExtractionRequest(prompt) {
  for (const pattern of CONTENT_EXTRACTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of CONTENT_EXTRACTION_KEYWORDS) {
    if (prompt.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the prompt is a "remove everything except" pattern
 */
function isRemoveExceptPattern(prompt) {
  const hasRemoveAction = prompt.includes('remove') || prompt.includes('hide');
  const hasExceptPattern =
    prompt.includes('rest') ||
    prompt.includes('other') ||
    prompt.includes('everything else') ||
    prompt.includes('all other');

  return hasRemoveAction && hasExceptPattern;
}

/**
 * Checks if the prompt contains any keywords from a list
 */
function containsKeyword(prompt, keywords) {
  return keywords.some((keyword) => prompt.includes(keyword));
}

/**
 * Checks if the prompt is a general element hiding request
 * (not targeting content-related elements)
 */
function isElementHidingRequest(prompt) {
  const hasHideAction =
    prompt.includes('hide') || prompt.includes('remove') || prompt.includes('delete');
  const targetsContent = containsKeyword(prompt, CONTENT_PROTECTION_KEYWORDS);

  return hasHideAction && !targetsContent;
}

/**
 * Checks if the prompt is any kind of hiding/removal request
 */
function isGeneralHidingRequest(prompt) {
  return (
    prompt.includes('hide') ||
    prompt.includes('remove') ||
    prompt.includes('delete') ||
    prompt.includes('no ') ||
    prompt.includes('without')
  );
}

/**
 * Checks if the prompt is a translation request
 */
function isTranslationRequest(prompt) {
  for (const pattern of TRANSLATION_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of TRANSLATION_KEYWORDS) {
    if (prompt.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the prompt indicates user wants content inserted INTO the page (not in popup)
 */
function isInsertIntoPageRequest(prompt) {
  for (const pattern of INSERT_INTO_PAGE_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the prompt is a summarize request
 * Returns false if user wants content inserted into the page (should use GENERAL task type instead)
 */
function isSummarizeRequest(prompt) {
  // If user wants to insert content into the page, don't treat as summarize
  // This allows the LLM to generate code that modifies the page directly
  if (isInsertIntoPageRequest(prompt)) {
    return false;
  }

  for (const pattern of SUMMARIZE_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of SUMMARIZE_KEYWORDS) {
    if (prompt.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the prompt is an analyze request
 */
function isAnalyzeRequest(prompt) {
  for (const pattern of ANALYZE_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of ANALYZE_KEYWORDS) {
    if (prompt.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts target language from the prompt
 * @param {string} prompt - The user's request
 * @returns {string|null} - The detected target language or null
 */
export function extractTargetLanguage(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  for (const pattern of TRANSLATION_PATTERNS) {
    const match = lowerPrompt.match(pattern);
    if (match && match[1]) {
      const lang = match[1].toLowerCase();
      if (SUPPORTED_LANGUAGES.some((supported) => supported.includes(lang) || lang.includes(supported))) {
        return match[1];
      }
    }
  }

  for (const lang of SUPPORTED_LANGUAGES) {
    if (lowerPrompt.includes(lang)) {
      return lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  }

  return null;
}

/**
 * Detects the task type from a user prompt
 * @param {string} prompt - The user's modification request
 * @returns {string} - The detected task type
 */
export function detectTaskType(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  // Priority 1: Translation request (check first as it's a specific feature)
  if (isTranslationRequest(lowerPrompt)) {
    return TASK_TYPES.TRANSLATION;
  }

  // Priority 2: Summarize request
  if (isSummarizeRequest(lowerPrompt)) {
    return TASK_TYPES.SUMMARIZE;
  }

  // Priority 3: Analyze request (questions and analysis about the page)
  if (isAnalyzeRequest(lowerPrompt)) {
    return TASK_TYPES.ANALYZE;
  }

  // Priority 4: Content extraction (most specific)
  if (isContentExtractionRequest(lowerPrompt)) {
    return TASK_TYPES.CONTENT_EXTRACTION;
  }

  // Priority 5: Remove except pattern (treat as content extraction)
  if (isRemoveExceptPattern(lowerPrompt)) {
    return TASK_TYPES.CONTENT_EXTRACTION;
  }

  // Priority 6: Ad removal
  if (containsKeyword(lowerPrompt, AD_KEYWORDS)) {
    return TASK_TYPES.AD_REMOVAL;
  }

  // Priority 7: Comment removal
  if (containsKeyword(lowerPrompt, COMMENT_KEYWORDS)) {
    return TASK_TYPES.COMMENT_REMOVAL;
  }

  // Priority 8: Styling changes
  if (containsKeyword(lowerPrompt, STYLING_KEYWORDS)) {
    return TASK_TYPES.STYLING;
  }

  // Priority 9: Element hiding (non-content related)
  if (isElementHidingRequest(lowerPrompt)) {
    return TASK_TYPES.ELEMENT_HIDING;
  }

  // Priority 10: General hiding requests
  if (isGeneralHidingRequest(lowerPrompt)) {
    return TASK_TYPES.ELEMENT_HIDING;
  }

  // Default: General modification
  return TASK_TYPES.GENERAL;
}
