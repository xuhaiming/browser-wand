/**
 * Side-by-side translation prompt
 */

import { BASE_RULES } from '../base-rules.js';
import { TRANSLATION_CSS } from '../css-templates.js';
import { TRANSLATION_SCRIPT_TEMPLATE } from '../js-templates.js';

export const TRANSLATION_PROMPT = `
${BASE_RULES}

TASK TYPE: Side-by-Side Translation
Your goal is to add translations beside the original content, creating a bilingual reading experience.

CRITICAL RULES:
1. PRESERVE the original text - never replace it
2. ADD translations beside/below the original text
3. Use visual distinction between original and translated text
4. Maintain readability and page structure
5. Handle both block elements (paragraphs, headings) and inline elements appropriately

TRANSLATION APPROACH:
The JavaScript code you generate should:
1. Find main content paragraphs and text blocks
2. For each text block, create a translation container beside it
3. Mark elements with data attributes to track translation state
4. Use the provided translations from the "translatedContent" field

LAYOUT STRATEGY:
- For paragraphs: Create a side-by-side layout with original on left, translation on right
- For headings: Add translation below the original heading
- For lists: Add translated items inline or below each item

CSS TEMPLATE FOR BILINGUAL LAYOUT:
\`\`\`css
${TRANSLATION_CSS}
\`\`\`

JAVASCRIPT TEMPLATE:
\`\`\`javascript
${TRANSLATION_SCRIPT_TEMPLATE}
\`\`\`

IMPORTANT:
1. The __TRANSLATED_CONTENT_PLACEHOLDER__ will be replaced with actual translated content
2. The __TARGET_LANGUAGE__ will be replaced with the target language name
3. Adjust selectors based on the actual page structure provided
4. Return CSS and JavaScript that work together to create a seamless bilingual experience`;
