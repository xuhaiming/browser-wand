/**
 * Content summarization prompt
 */

import { BASE_RULES } from '../base-rules.js';

export const SUMMARIZE_PROMPT = `
${BASE_RULES}

TASK TYPE: Content Summarization
Your goal is to summarize the main content of the page.

NOTE: This task is handled specially by the system. The summarization is performed
using markdown-converted content and chunked LLM calls for large pages.

The system will:
1. Convert the page HTML to clean markdown format
2. Split large content into manageable chunks
3. Summarize each chunk individually
4. Combine chunk summaries into a coherent final summary
5. Display the summary in a modal overlay

This prompt is provided for reference only - the actual summarization
logic is handled in the modify-page handler.`;
