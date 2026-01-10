/**
 * HTML to Markdown conversion utility
 * Converts HTML content to clean, readable markdown format
 * for more efficient LLM processing
 *
 * Note: This implementation uses regex-based parsing to work
 * in service worker environments without DOM APIs
 */

/**
 * Converts HTML string to Markdown format
 * @param {string} html - The HTML content to convert
 * @param {Object} options - Conversion options
 * @param {number} options.maxLength - Maximum length of output
 * @returns {string} - Markdown formatted text
 */
export function htmlToMarkdown(html, options = {}) {
  const { maxLength = 50000 } = options;

  let content = html;

  content = removeUnwantedElements(content);
  content = convertHtmlToMarkdown(content);
  content = cleanMarkdown(content);

  if (content.length > maxLength) {
    return content.substring(0, maxLength) + '\n\n[Content truncated...]';
  }

  return content;
}

/**
 * Removes unwanted HTML elements using regex
 */
function removeUnwantedElements(html) {
  let content = html;

  const tagsToRemove = [
    'script',
    'style',
    'noscript',
    'svg',
    'iframe',
    'canvas',
    'video',
    'audio',
    'form',
    'input',
    'button',
    'select',
    'textarea',
    'nav',
    'footer',
    'aside',
    'head',
    'meta',
    'link',
  ];

  tagsToRemove.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    content = content.replace(regex, '');
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    content = content.replace(selfClosingRegex, '');
  });

  content = content.replace(/<!--[\s\S]*?-->/g, '');

  const classPatterns = [
    /class="[^"]*(?:ad-container|advertisement|sidebar|comment|social-share|share-button|related|recommend)[^"]*"/gi,
  ];
  classPatterns.forEach((pattern) => {
    content = content.replace(pattern, '');
  });

  return content;
}

/**
 * Converts HTML tags to Markdown syntax
 */
function convertHtmlToMarkdown(html) {
  let content = html;

  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');
  content = content.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n');
  content = content.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n');

  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

  content = content.replace(/<br\s*\/?>/gi, '\n');

  content = content.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  content = content.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  content = content.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');
  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  content = content.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n\n```\n$1\n```\n\n');

  content = content.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, text) => {
    const lines = text.trim().split('\n');
    return '\n\n' + lines.map((line) => `> ${line.trim()}`).join('\n') + '\n\n';
  });

  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  content = content.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  content = content.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  content = content.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  content = content.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const markdownItems = items.map((item) => {
      const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
      return `- ${stripHtml(text)}`;
    });
    return '\n\n' + markdownItems.join('\n') + '\n\n';
  });

  content = content.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const markdownItems = items.map((item, index) => {
      const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
      return `${index + 1}. ${stripHtml(text)}`;
    });
    return '\n\n' + markdownItems.join('\n') + '\n\n';
  });

  content = content.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    return convertTable(tableContent);
  });

  content = content.replace(/<[^>]+>/g, '');

  content = decodeHtmlEntities(content);

  return content;
}

/**
 * Strips HTML tags from text
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * Converts HTML table to Markdown table
 */
function convertTable(tableHtml) {
  const rows = [];

  const headerMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  let headerCells = [];

  if (headerMatch) {
    const thMatches = headerMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    headerCells = thMatches.map((th) => stripHtml(th.replace(/<th[^>]*>([\s\S]*?)<\/th>/i, '$1')));
  } else {
    const firstRowMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    if (firstRowMatch) {
      const cellMatches = firstRowMatch[1].match(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [];
      headerCells = cellMatches.map((cell) =>
        stripHtml(cell.replace(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/i, '$1'))
      );
    }
  }

  if (headerCells.length === 0) return '';

  rows.push('| ' + headerCells.join(' | ') + ' |');
  rows.push('| ' + headerCells.map(() => '---').join(' | ') + ' |');

  const bodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : tableHtml;

  const trMatches = bodyHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  const startIndex = headerMatch ? 0 : 1;

  for (let i = startIndex; i < trMatches.length; i++) {
    const tdMatches = trMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (tdMatches.length > 0) {
      const cells = tdMatches.map((td) => stripHtml(td.replace(/<td[^>]*>([\s\S]*?)<\/td>/i, '$1')));
      rows.push('| ' + cells.join(' | ') + ' |');
    }
  }

  return '\n\n' + rows.join('\n') + '\n\n';
}

/**
 * Decodes common HTML entities
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  let result = text;
  Object.entries(entities).forEach(([entity, char]) => {
    result = result.replace(new RegExp(entity, 'g'), char);
  });

  result = result.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return result;
}

/**
 * Cleans up the markdown output
 */
function cleanMarkdown(markdown) {
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '')
    .trim();
}

/**
 * Extracts main content and converts to markdown
 * Optimized for article/content pages
 * @param {Object} pageContent - Page content object from content script
 * @returns {string} - Markdown formatted main content
 */
export function extractMainContentAsMarkdown(pageContent) {
  const { html, title, url } = pageContent;

  let markdown = '';

  if (title) {
    markdown += `# ${title}\n\n`;
  }

  if (url) {
    markdown += `Source: ${url}\n\n---\n\n`;
  }

  const contentMarkdown = htmlToMarkdown(html, { maxLength: 40000 });
  markdown += contentMarkdown;

  return markdown;
}

/**
 * Splits text into chunks suitable for LLM processing
 * @param {string} text - Text to split
 * @param {number} maxChunkSize - Maximum size of each chunk
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
export function splitIntoChunks(text, maxChunkSize = 8000, overlap = 200) {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;

    if (endIndex < text.length) {
      const paragraphEnd = text.lastIndexOf('\n\n', endIndex);
      if (paragraphEnd > startIndex + maxChunkSize / 2) {
        endIndex = paragraphEnd;
      } else {
        const sentenceEnd = text.lastIndexOf('. ', endIndex);
        if (sentenceEnd > startIndex + maxChunkSize / 2) {
          endIndex = sentenceEnd + 1;
        }
      }
    }

    chunks.push(text.substring(startIndex, endIndex).trim());

    startIndex = endIndex - overlap;
    if (startIndex < 0) startIndex = 0;

    if (endIndex >= text.length) break;
  }

  return chunks;
}
