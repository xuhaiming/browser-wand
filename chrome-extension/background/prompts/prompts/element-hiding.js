/**
 * Element hiding prompt
 */

import { BASE_RULES } from '../base-rules.js';
import { SELECTIVE_HIDING_SCRIPT } from '../js-templates.js';

export const ELEMENT_HIDING_PROMPT = `
${BASE_RULES}

TASK TYPE: Element Hiding
Your goal is to hide specific elements as requested while PRESERVING main content.

CRITICAL SAFETY RULES:
1. NEVER hide elements that contain the main article/content
2. ALWAYS check if an element contains substantial text before hiding
3. If user says "remove everything except X", treat as CONTENT_EXTRACTION
4. When in doubt, be conservative - better to leave visible than break the page

SAFE HIDING PATTERNS:
- By specific ID: #element-id { display: none !important; }
- By specific class: .specific-class-name { display: none !important; }
- By semantic role: [role="navigation"] { display: none !important; }
- By tag (with caution): aside, footer { display: none !important; }

JAVASCRIPT FOR SELECTIVE HIDING WITH SAFETY:
\`\`\`javascript
${SELECTIVE_HIDING_SCRIPT}
\`\`\`

AVOID:
- body > * selectors (hides everything)
- div, section without qualifiers (too broad)
- Hiding elements with long text content
- Hiding parent containers of main content`;
