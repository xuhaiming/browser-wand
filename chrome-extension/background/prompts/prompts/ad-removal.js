/**
 * Advertisement removal prompt
 */

import { BASE_RULES } from '../base-rules.js';
import { AD_REMOVAL_CSS } from '../css-templates.js';
import { AD_REMOVAL_SCRIPT } from '../js-templates.js';

export const AD_REMOVAL_PROMPT = `
${BASE_RULES}

TASK TYPE: Advertisement Removal
Your goal is to hide ALL advertisements, sponsored content, and promotional elements on ANY website.

IMPORTANT: You MUST return BOTH CSS and JavaScript code for comprehensive ad removal.

STRATEGY:
1. Use CSS for immediate hiding of known ad patterns
2. Use JavaScript for dynamic detection and removal of ads that CSS might miss
3. Use MutationObserver to catch dynamically loaded ads

JAVASCRIPT TEMPLATE (REQUIRED - copy and use this):
\`\`\`javascript
${AD_REMOVAL_SCRIPT}
\`\`\`

CSS TEMPLATE (REQUIRED - use alongside JavaScript):
\`\`\`css
${AD_REMOVAL_CSS}
\`\`\`

IMPORTANT NOTES:
1. ALWAYS return BOTH the JavaScript code AND the CSS code
2. The JavaScript uses pattern matching with exclusions to avoid hiding legitimate content
3. MutationObserver catches ads that load after page load
4. Safety checks prevent hiding elements with substantial content
5. This approach works on virtually any website`;
