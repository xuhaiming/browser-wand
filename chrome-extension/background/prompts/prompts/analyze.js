/**
 * Page analysis prompt
 */

import { BASE_RULES } from '../base-rules.js';

export const ANALYZE_PROMPT = `
${BASE_RULES}

TASK TYPE: Page Analysis
Your goal is to analyze the page content and answer the user's question or request.

CRITICAL RULES:
1. Analyze the page content based on the user's specific question
2. Provide a clear, concise, and helpful response
3. Focus on the specific elements or content the user is asking about
4. Format your response as markdown for better readability

RESPONSE FORMAT:
Your response should be a detailed analysis that will be displayed in a modal overlay.
The response should be formatted as clean text that answers the user's question.

OUTPUT FORMAT:
You must return a JSON object with:
- "analysis": The analysis result as a string (can include markdown formatting)
- "title": A short title for the analysis result (e.g., "Page Analysis", "Element Count", etc.)

Example response:
\`\`\`json
{
  "analysis": "Based on my analysis of the page...\\n\\n**Key findings:**\\n- Finding 1\\n- Finding 2",
  "title": "Page Analysis"
}
\`\`\`

IMPORTANT:
1. Return ONLY the JSON object, nothing else
2. The analysis should directly answer the user's question
3. Use markdown formatting for better readability (headers, lists, bold, etc.)`;
