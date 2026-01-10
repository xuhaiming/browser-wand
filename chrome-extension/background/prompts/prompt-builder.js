/**
 * Prompt builder module
 * Constructs system and user prompts for LLM requests
 */

import { TASK_TYPES, CONTENT_LIMITS } from '../config.js';
import { JSON_RESPONSE_FORMAT } from './base-rules.js';
import {
  CONTENT_EXTRACTION_PROMPT,
  AD_REMOVAL_PROMPT,
  COMMENT_REMOVAL_PROMPT,
  ELEMENT_HIDING_PROMPT,
  STYLING_PROMPT,
  THEMATIC_RESKINNING_PROMPT,
  GENERAL_PROMPT,
  TRANSLATION_PROMPT,
  SUMMARIZE_PROMPT,
  ANALYZE_PROMPT,
} from './task-prompts.js';

const TASK_PROMPTS = {
  [TASK_TYPES.CONTENT_EXTRACTION]: CONTENT_EXTRACTION_PROMPT,
  [TASK_TYPES.AD_REMOVAL]: AD_REMOVAL_PROMPT,
  [TASK_TYPES.COMMENT_REMOVAL]: COMMENT_REMOVAL_PROMPT,
  [TASK_TYPES.ELEMENT_HIDING]: ELEMENT_HIDING_PROMPT,
  [TASK_TYPES.STYLING]: STYLING_PROMPT,
  [TASK_TYPES.THEMATIC_RESKINNING]: THEMATIC_RESKINNING_PROMPT,
  [TASK_TYPES.TRANSLATION]: TRANSLATION_PROMPT,
  [TASK_TYPES.SUMMARIZE]: SUMMARIZE_PROMPT,
  [TASK_TYPES.ANALYZE]: ANALYZE_PROMPT,
  [TASK_TYPES.GENERAL]: GENERAL_PROMPT,
};

/**
 * Builds the system prompt for page analysis
 */
export function buildAnalyzeSystemPrompt(pageContent) {
  return `You are an AI assistant that analyzes web pages. The user will provide you with page content and a question or request about the page.

Analyze the page and provide a helpful, concise response. Focus on the specific elements or content the user is asking about.

Page URL: ${pageContent.url}
Page Title: ${pageContent.title}

Available Elements Summary:
- Buttons: ${pageContent.elements.buttons.length} found
- Links: ${pageContent.elements.links.length} found
- Input fields: ${pageContent.elements.inputs.length} found
- Images: ${pageContent.elements.images.length} found
- Headings: ${pageContent.elements.headings.length} found
- Divs: ${pageContent.elements.divs.count}
- Spans: ${pageContent.elements.spans.count}`;
}

/**
 * Builds the user message for page analysis
 */
export function buildAnalyzeUserMessage(prompt, pageContent) {
  return `User's request: ${prompt}

Page Content (simplified HTML):
${pageContent.html.substring(0, CONTENT_LIMITS.htmlSubstringLength)}

Visible Text:
${pageContent.text.substring(0, CONTENT_LIMITS.textSubstringLength)}

Element Details:
Buttons: ${JSON.stringify(pageContent.elements.buttons, null, 2)}
Links: ${JSON.stringify(pageContent.elements.links.slice(0, CONTENT_LIMITS.linksPreviewCount), null, 2)}
Inputs: ${JSON.stringify(pageContent.elements.inputs, null, 2)}
Headings: ${JSON.stringify(pageContent.elements.headings, null, 2)}`;
}

/**
 * Builds the system prompt for page modification based on task type
 */
export function buildModifySystemPrompt(taskType, pageContent) {
  const taskPrompt = TASK_PROMPTS[taskType] || TASK_PROMPTS[TASK_TYPES.GENERAL];

  return `${taskPrompt}${JSON_RESPONSE_FORMAT}

Page URL: ${pageContent.url}
Page Title: ${pageContent.title}`;
}

/**
 * Formats semantic structure information
 */
function formatSemanticStructure(semantic) {
  let output = `
Semantic HTML Elements:
- Header tags: ${semantic.header?.length || 0}
- Nav tags: ${semantic.nav?.length || 0}
- Main tags: ${semantic.main?.length || 0}
- Article tags: ${semantic.article?.length || 0}
- Aside tags: ${semantic.aside?.length || 0}
- Footer tags: ${semantic.footer?.length || 0}
`;

  if (semantic.article?.length > 0) {
    output += `\nArticle elements:\n${JSON.stringify(semantic.article, null, 2)}`;
  }
  if (semantic.main?.length > 0) {
    output += `\nMain elements:\n${JSON.stringify(semantic.main, null, 2)}`;
  }

  return output;
}

/**
 * Builds the user message for page modification
 */
export function buildModifyUserMessage(taskType, prompt, pageContent, translationData = null, previousModifications = null) {
  const elements = pageContent.elements;

  let contextInfo = `User's modification request: ${prompt}

=== PAGE STRUCTURE ===
`;

  if (previousModifications?.hasModifications) {
    contextInfo += `
=== PREVIOUS MODIFICATIONS APPLIED ===
The page has already been modified with the following changes. Your new code should only implement the NEW changes requested, as the previous modifications are already applied and active on the page.

Previously applied CSS (${previousModifications.appliedCss?.length || 0} rules):
${previousModifications.appliedCss?.join('\n\n') || 'None'}

Previously applied JavaScript (${previousModifications.appliedCode?.length || 0} scripts):
${previousModifications.appliedCode?.map((code, i) => `--- Script ${i + 1} ---\n${code}`).join('\n\n') || 'None'}

IMPORTANT: Do NOT repeat or undo the previous modifications. Only generate code for the NEW changes requested.
===

`;
  }

  // Add semantic structure if available
  if (elements.semanticStructure) {
    contextInfo += formatSemanticStructure(elements.semanticStructure);
  }

  // Add main content candidates for content extraction
  if (taskType === TASK_TYPES.CONTENT_EXTRACTION && elements.mainContentCandidates?.length > 0) {
    contextInfo += `\n=== MAIN CONTENT CANDIDATES ===\n${JSON.stringify(elements.mainContentCandidates, null, 2)}`;
  }

  // Add detected ads for ad removal and content extraction
  if (
    (taskType === TASK_TYPES.AD_REMOVAL || taskType === TASK_TYPES.CONTENT_EXTRACTION) &&
    elements.suspectedAds?.length > 0
  ) {
    contextInfo += `\n=== DETECTED ADS (${elements.suspectedAds.length} found) ===\n${JSON.stringify(elements.suspectedAds.slice(0, CONTENT_LIMITS.adsPreviewCount), null, 2)}`;
  }

  // Add detected comments for comment removal and content extraction
  if (
    (taskType === TASK_TYPES.COMMENT_REMOVAL || taskType === TASK_TYPES.CONTENT_EXTRACTION) &&
    elements.suspectedComments?.length > 0
  ) {
    contextInfo += `\n=== DETECTED COMMENTS (${elements.suspectedComments.length} found) ===\n${JSON.stringify(elements.suspectedComments, null, 2)}`;
  }

  // Add translation data for translation tasks
  if (taskType === TASK_TYPES.TRANSLATION && translationData) {
    contextInfo += `\n=== TRANSLATION DATA ===
Target Language: ${translationData.targetLanguage}
Number of text blocks to translate: ${translationData.textBlocks?.length || 0}

=== TRANSLATED CONTENT ===
${JSON.stringify(translationData.translations, null, 2)}

=== ORIGINAL TEXT BLOCKS ===
${JSON.stringify(translationData.textBlocks?.slice(0, 20), null, 2)}`;
  }

  // Add headings
  contextInfo += `\n=== HEADINGS ===\n${JSON.stringify(elements.headings, null, 2)}`;

  // Add page HTML
  contextInfo += `\n=== PAGE HTML (partial) ===\n${pageContent.html.substring(0, CONTENT_LIMITS.htmlContextLength)}`;

  // Add interactive elements for element hiding and general tasks
  if (taskType === TASK_TYPES.ELEMENT_HIDING || taskType === TASK_TYPES.GENERAL) {
    contextInfo += `\n=== INTERACTIVE ELEMENTS ===
Buttons: ${JSON.stringify(elements.buttons, null, 2)}
Links (first ${CONTENT_LIMITS.linksPreviewCount}): ${JSON.stringify(elements.links.slice(0, CONTENT_LIMITS.linksPreviewCount), null, 2)}
Inputs: ${JSON.stringify(elements.inputs, null, 2)}`;
  }

  contextInfo += `\n
=== IMPORTANT ===
Generate working CSS and/or JavaScript code to fulfill the user's request.
Use the detected elements and selectors provided above.
Respond ONLY with valid JSON in the specified format.`;

  return contextInfo;
}
