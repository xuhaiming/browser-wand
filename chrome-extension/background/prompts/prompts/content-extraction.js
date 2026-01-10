/**
 * Content extraction / Reader mode prompt
 */

import { BASE_RULES } from '../base-rules.js';
import {
  CONTENT_SELECTORS,
  formatSelectorsForPrompt,
} from '../selectors.js';
import { getContentExtractionScript } from '../js-templates.js';

export const CONTENT_EXTRACTION_PROMPT = `
${BASE_RULES}

TASK TYPE: Content Extraction / Reader Mode
Your goal is to isolate the main article content and hide everything else.

CRITICAL SAFETY RULES:
1. NEVER use CSS that hides body > * unconditionally - this causes content loss
2. JavaScript MUST run FIRST to identify and mark content BEFORE any CSS hiding
3. ALWAYS verify content was found before applying hiding styles
4. If content detection fails, show a warning instead of hiding everything

CONTENT DETECTION STRATEGY:
Use these selector categories in order of reliability:

1. Schema.org / Data Attributes (most reliable):
${formatSelectorsForPrompt([...CONTENT_SELECTORS.schemaOrg, ...CONTENT_SELECTORS.dataAttributes])}

2. Semantic Class Patterns:
${formatSelectorsForPrompt(CONTENT_SELECTORS.articleClasses)}

3. ID-based Selectors:
${formatSelectorsForPrompt(CONTENT_SELECTORS.articleIds)}

4. Attribute Contains Patterns:
${formatSelectorsForPrompt(CONTENT_SELECTORS.attributePatterns)}

5. Semantic Elements (fallback):
${formatSelectorsForPrompt(CONTENT_SELECTORS.semantic)}

ELEMENTS TO HIDE (after content found):
- Navigation: header, footer, nav, aside
- Sidebars, related articles, recommendations
- Social sharing, newsletters
- Ads, comments, popups

REQUIRED APPROACH:
Use this JavaScript pattern that safely detects content before hiding:

\`\`\`javascript
${getContentExtractionScript()}
\`\`\`

IMPORTANT:
1. The JavaScript above is the COMPLETE solution
2. Return empty CSS (css: "") since styling is handled in the JS
3. If you see specific content patterns in the page HTML, add them to CONTENT_SELECTORS`;
