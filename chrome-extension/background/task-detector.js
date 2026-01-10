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

const THEMATIC_RESKINNING_PATTERNS = [
  /(?:make|turn|transform|convert|style|reskin|restyle)\s+(?:this|the)?\s*(?:page|site|website)?\s*(?:look|appear|seem)?\s*(?:like|into|as)\s+(?:a\s+)?(?:\d+s\s+)?(?:cyberpunk|retro|vintage|hacker|terminal|matrix|neon|synthwave|vaporwave|steampunk|gothic|medieval|futuristic|sci[\s-]?fi|newspaper|magazine|comic|cartoon|anime|children'?s?\s*book|storybook|fairy\s*tale|minimalist|brutalist|art\s*deco|art\s*nouveau|victorian|renaissance|baroque|pixel|8[\s-]?bit|90s|80s|70s|60s|nostalgic|old[\s-]?school|grunge|punk|pastel|cozy|warm|cold|dark|horror|spooky|halloween|christmas|festive|tropical|beach|forest|nature|ocean|space|cosmic|galactic)/i,
  /(?:cyberpunk|retro|vintage|hacker|terminal|matrix|neon|synthwave|vaporwave|steampunk|gothic|medieval|futuristic|sci[\s-]?fi|newspaper|magazine|comic|cartoon|anime|children'?s?\s*book|storybook|fairy\s*tale|minimalist|brutalist|art\s*deco|art\s*nouveau|victorian|renaissance|baroque|pixel|8[\s-]?bit|90s|80s|70s|60s|nostalgic|old[\s-]?school|grunge|punk|pastel|cozy|warm|cold|dark|horror|spooky|halloween|christmas|festive|tropical|beach|forest|nature|ocean|space|cosmic|galactic)\s+(?:style|theme|look|aesthetic|vibe|mood|feel|design|reskin)/i,
  /(?:reskin|restyle|makeover|redesign|overhaul|transform)\s+(?:this|the)?\s*(?:page|site|website)?\s*(?:to|with|using|in)\s+(?:a\s+)?(?:\w+\s+)?(?:style|theme|aesthetic|vibe|mood|look)/i,
  /(?:give|apply|add)\s+(?:this|the)?\s*(?:page|site|website)?\s*(?:a\s+)?(?:\w+\s+)?(?:makeover|reskin|aesthetic|vibe|theme)/i,
  /(?:boring|plain|dull)\s+(?:\w+\s+)*(?:look|appear|seem)\s+(?:like|as)/i,
];

const THEMATIC_RESKINNING_KEYWORDS = [
  'look like a',
  'style like',
  'reskin',
  'restyle',
  'makeover',
  'aesthetic',
  'vibe',
  'era',
  'mood',
  'cyberpunk',
  'hacker terminal',
  'retro',
  'vintage newspaper',
  'children\'s book',
  'storybook',
  'comic book',
  'newspaper style',
  'magazine style',
  '90s website',
  '80s style',
  'neon',
  'synthwave',
  'vaporwave',
  'steampunk',
  'gothic',
  'medieval',
  'futuristic',
  'sci-fi',
  'matrix',
  'terminal style',
  'pixel art',
  '8-bit',
  'art deco',
  'minimalist',
  'brutalist',
  'cozy',
  'warm aesthetic',
  'dark aesthetic',
  'pastel',
];

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

const MAGIC_BAR_PATTERNS = [
  // Product search patterns
  /(?:show|find|search|display|get)\s+(?:similar|related|comparable|equivalent)\s+(?:products?|items?)/i,
  /(?:compare|comparison)\s+(?:prices?|products?)\s+(?:from|on|with)\s+(?:other|different)\s+(?:sites?|websites?|stores?|shops?|platforms?)/i,
  /(?:similar|related)\s+(?:products?|items?)\s+(?:from|on)\s+(?:other|different)\s+(?:sites?|websites?|stores?|shops?)/i,
  /(?:find|search|show|display)\s+(?:this|the)\s+(?:product|item)\s+(?:on|from|in)\s+(?:other|different)\s+(?:sites?|websites?|stores?)/i,
  /(?:cross[\s-]?site|multi[\s-]?site)\s+(?:product|price)\s+(?:comparison|search)/i,
  /(?:price|product)\s+(?:comparison|compare)\s+(?:across|between)\s+(?:sites?|websites?|stores?)/i,
  /(?:find|show|display)\s+(?:alternatives?|competitors?)/i,
  /(?:related|similar)\s+(?:from|on)\s+(?:amazon|lazada|shopee|aliexpress|ebay|walmart|taobao|jd\.com)/i,
  // Generic web search patterns
  /(?:magic\s*bar|web\s*search|online\s*search|google\s*search|search\s*online|search\s*the\s*web)/i,
  /(?:search|find|look\s*up|lookup)\s+(?:for|about)?\s*(?:information|info|details|data)\s+(?:on|about)/i,
  /(?:what\s+(?:is|are)|who\s+(?:is|are)|when\s+(?:is|was|did)|where\s+(?:is|are)|how\s+(?:to|do|does|did))\s+.{3,}/i,
  /(?:find|search|get|show)\s+(?:me\s+)?(?:the\s+)?(?:latest|recent|current|new)\s+(?:news|information|updates?|articles?)/i,
  /(?:look\s*up|search\s*for|find)\s+(?:on\s+)?(?:the\s+)?(?:internet|web|online)/i,
  // More flexible news/information search patterns
  /(?:find|search|get|show)\s+(?:me\s+)?(?:\w+\s+)?(?:news|articles?|stories?|posts?|updates?)\s+(?:about|on|for|related)/i,
  /(?:find|search|get|show)\s+(?:me\s+)?(?:relevant|related|similar|more)\s+(?:news|articles?|stories?|information|content)/i,
  // Image generation patterns
  /(?:create|generate|make|draw|design|produce)\s+(?:an?\s+)?(?:image|picture|photo|illustration|art|artwork|graphic|visual)/i,
  /(?:image|picture|photo|illustration|art|artwork|graphic)\s+(?:of|showing|depicting|with)/i,
  /(?:show|display|give)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration)/i,
  /(?:visualize|illustrate)\s+/i,
  // General question patterns
  /(?:tell\s+me\s+about|explain|describe)\s+.{3,}/i,
  /(?:best|top|recommended)\s+[\w\s]+(?:for|to|in)/i,
  /(?:how\s+(?:can|do|should)\s+i)\s+/i,
  /(?:what\s+(?:should|can|would))\s+/i,
  /(?:tips|advice|suggestions?|recommendations?)\s+(?:for|on|about)/i,
];

const MAGIC_BAR_KEYWORDS = [
  // Product search keywords
  'similar products',
  'related products',
  'compare prices',
  'price comparison',
  'cross-site comparison',
  'find alternatives',
  'competitor products',
  'product comparison',
  // Generic search keywords
  'magic bar',
  'web search',
  'search online',
  'search the web',
  'look up',
  'find information',
  'search for',
  // News/content search keywords
  'relevant news',
  'related news',
  'similar news',
  'more news',
  'find news',
  'related articles',
  'similar articles',
  // Image generation keywords
  'generate image',
  'create image',
  'make image',
  'draw',
  'illustration',
  'picture of',
  'image of',
  'artwork',
  'visualize',
  // General query keywords
  'best',
  'top rated',
  'recommended',
  'tips for',
  'how to',
  'what is',
  'who is',
  'latest news',
  'reviews',
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
 * Checks if the prompt is a Magic Bar search request
 * Magic Bar is a universal search feature that uses Google Search grounding
 */
function isMagicBarRequest(prompt) {
  for (const pattern of MAGIC_BAR_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of MAGIC_BAR_KEYWORDS) {
    if (prompt.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the prompt is a thematic reskinning request
 * (transforming the page to match a specific mood, era, or aesthetic)
 */
function isThematicReskinningRequest(prompt) {
  for (const pattern of THEMATIC_RESKINNING_PATTERNS) {
    if (pattern.test(prompt)) {
      return true;
    }
  }

  for (const keyword of THEMATIC_RESKINNING_KEYWORDS) {
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

  // Priority 1: Magic Bar request (universal web search feature)
  if (isMagicBarRequest(lowerPrompt)) {
    return TASK_TYPES.MAGIC_BAR;
  }

  // Priority 2: Translation request
  if (isTranslationRequest(lowerPrompt)) {
    return TASK_TYPES.TRANSLATION;
  }

  // Priority 3: Summarize request
  if (isSummarizeRequest(lowerPrompt)) {
    return TASK_TYPES.SUMMARIZE;
  }

  // Priority 4: Analyze request (questions and analysis about the page)
  if (isAnalyzeRequest(lowerPrompt)) {
    return TASK_TYPES.ANALYZE;
  }

  // Priority 5: Content extraction (most specific)
  if (isContentExtractionRequest(lowerPrompt)) {
    return TASK_TYPES.CONTENT_EXTRACTION;
  }

  // Priority 6: Remove except pattern (treat as content extraction)
  if (isRemoveExceptPattern(lowerPrompt)) {
    return TASK_TYPES.CONTENT_EXTRACTION;
  }

  // Priority 7: Ad removal
  if (containsKeyword(lowerPrompt, AD_KEYWORDS)) {
    return TASK_TYPES.AD_REMOVAL;
  }

  // Priority 8: Comment removal
  if (containsKeyword(lowerPrompt, COMMENT_KEYWORDS)) {
    return TASK_TYPES.COMMENT_REMOVAL;
  }

  // Priority 9: Thematic reskinning (check before basic styling - more specific)
  if (isThematicReskinningRequest(lowerPrompt)) {
    return TASK_TYPES.THEMATIC_RESKINNING;
  }

  // Priority 10: Styling changes
  if (containsKeyword(lowerPrompt, STYLING_KEYWORDS)) {
    return TASK_TYPES.STYLING;
  }

  // Priority 11: Element hiding (non-content related)
  if (isElementHidingRequest(lowerPrompt)) {
    return TASK_TYPES.ELEMENT_HIDING;
  }

  // Priority 12: General hiding requests
  if (isGeneralHidingRequest(lowerPrompt)) {
    return TASK_TYPES.ELEMENT_HIDING;
  }

  // Default: General modification
  return TASK_TYPES.GENERAL;
}
