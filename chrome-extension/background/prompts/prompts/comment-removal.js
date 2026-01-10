/**
 * Comment section removal prompt
 */

import { BASE_RULES } from '../base-rules.js';
import { NON_CONTENT_SELECTORS, formatSelectorsForPrompt } from '../selectors.js';
import { generateCommentRemovalCSS } from '../css-templates.js';

export const COMMENT_REMOVAL_PROMPT = `
${BASE_RULES}

TASK TYPE: Comment Section Removal
Your goal is to hide comment sections, discussions, and reply threads.

COMMENT SELECTORS:
${formatSelectorsForPrompt(NON_CONTENT_SELECTORS.comments)}

Additional patterns:
- [class*="discussion"], [id*="discussion"]
- [class*="reply"], [class*="replies"]
- .comments-section, .comment-thread, .user-comments

CSS TEMPLATE:
\`\`\`css
${generateCommentRemovalCSS()}
\`\`\``;
