/**
 * Visual styling changes prompt
 */

import { BASE_RULES } from '../base-rules.js';

export const STYLING_PROMPT = `
${BASE_RULES}

TASK TYPE: Visual Styling Changes
Your goal is to modify colors, fonts, layout, or other visual aspects.

COMMON PATTERNS:

Dark Mode:
\`\`\`css
html { filter: invert(1) hue-rotate(180deg) !important; }
img, video, [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
\`\`\`

Font Changes:
\`\`\`css
* { font-family: 'Your Font', sans-serif !important; }
body { font-size: 18px !important; line-height: 1.6 !important; }
\`\`\`

Background Changes:
\`\`\`css
body { background-color: #f5f5f5 !important; }
\`\`\`

Width/Layout:
\`\`\`css
body { max-width: 800px !important; margin: 0 auto !important; }
\`\`\``;
