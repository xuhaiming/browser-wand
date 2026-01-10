/**
 * Text extraction utilities
 * Extracts and processes text content from page data for translation
 */

import { htmlToMarkdown } from '../../utils/html-to-markdown.js';

const TEXT_BLOCK_LIMITS = {
  maxHeadings: 15,
  maxParagraphs: 35,
  minHeadingLength: 5,
  minParagraphLength: 30,
};

const MARKDOWN_LIMITS = {
  maxLength: 40000,
};

/**
 * Normalizes text for deduplication
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  return text?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
}

/**
 * Converts page content to markdown for efficient LLM processing
 * @param {Object} pageContent - Page content data
 * @returns {string} - Markdown formatted content
 */
export function convertToMarkdown(pageContent) {
  const markdown = htmlToMarkdown(pageContent.html, { maxLength: MARKDOWN_LIMITS.maxLength });
  return `# ${pageContent.title || 'Page Content'}\n\nSource: ${pageContent.url}\n\n---\n\n${markdown}`;
}

/**
 * Extracts main text blocks from page content for translation
 * Extracts headings and paragraphs separately to maintain proper matching
 * @param {Object} pageContent - Page content data
 * @returns {{ headings: string[], paragraphs: string[] }} - Object with headings and paragraphs arrays
 */
export function extractTextBlocks(pageContent) {
  const headings = [];
  const paragraphs = [];
  const seenHeadings = new Set();
  const seenParagraphs = new Set();

  // Extract headings
  if (pageContent.elements?.headings) {
    pageContent.elements.headings.forEach((h) => {
      const text = h.text?.trim();
      if (!text || text.length < TEXT_BLOCK_LIMITS.minHeadingLength) return;
      const normalized = normalizeText(text);
      if (seenHeadings.has(normalized)) return;
      seenHeadings.add(normalized);
      headings.push(text);
    });
  }

  // Extract paragraphs from textBlocks (these come from content.js getTextBlocks)
  // which queries actual <p> elements in the DOM
  if (pageContent.textBlocks && Array.isArray(pageContent.textBlocks)) {
    pageContent.textBlocks.forEach((block) => {
      const text = block?.trim();
      if (!text || text.length < TEXT_BLOCK_LIMITS.minParagraphLength) return;
      const normalized = normalizeText(text);
      if (seenParagraphs.has(normalized)) return;
      seenParagraphs.add(normalized);
      paragraphs.push(text);
    });
  }

  console.log('[Browser Wand] extractTextBlocks: Extracted', headings.length, 'headings and', paragraphs.length, 'paragraphs');

  // Limit to prevent excessive API calls
  return {
    headings: headings.slice(0, TEXT_BLOCK_LIMITS.maxHeadings),
    paragraphs: paragraphs.slice(0, TEXT_BLOCK_LIMITS.maxParagraphs),
  };
}
