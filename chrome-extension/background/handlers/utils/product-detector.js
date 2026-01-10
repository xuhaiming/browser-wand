/**
 * Product detection utilities
 * Extracts product information and detects e-commerce contexts
 */

const PRICE_PATTERNS = [
  /(?:price|cost|total)[\s:]*[$¥€£₹₩₱S]?\s*[\d,]+\.?\d*/gi,
  /[$¥€£₹₩][\d,]+\.?\d*/g,
  /(?:RM|SGD|USD|EUR|GBP|JPY|CNY|KRW|INR|THB|VND|PHP|IDR)\s*[\d,]+\.?\d*/gi,
  /[\d,]+\.?\d*\s*(?:RM|SGD|USD|EUR|GBP|JPY|CNY|KRW|INR|THB|VND|PHP|IDR)/gi,
];

const CATEGORY_PATTERNS = [
  'electronics', 'fashion', 'clothing', 'shoes', 'beauty',
  'home', 'kitchen', 'toys', 'sports', 'books',
  'food', 'health', 'jewelry', 'watches', 'bags', 'furniture',
];

const PRODUCT_URL_PATTERNS = [
  /\/product\//,
  /\/item\//,
  /\/p\//,
  /\/dp\//,
  /\/gp\/product/,
  /\/buy\//,
  /\/shop\//,
  /productdetail/i,
  /itemdetail/i,
];

const ECOMMERCE_DOMAINS = [
  'amazon', 'ebay', 'walmart', 'target', 'aliexpress', 'lazada', 'shopee',
  'etsy', 'bestbuy', 'newegg', 'taobao', 'jd.com', 'flipkart', 'rakuten',
];

/**
 * Extracts price from text using common price patterns
 * @param {string} text - Text to search for price
 * @returns {string} - Found price or empty string
 */
function extractPrice(text) {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return '';
}

/**
 * Detects product category from URL and content
 * @param {string} url - Page URL
 * @param {string} name - Product name
 * @param {string} description - Product description
 * @returns {string} - Detected category or empty string
 */
function detectCategory(url, name, description) {
  const searchText = `${url} ${name} ${description}`.toLowerCase();

  for (const cat of CATEGORY_PATTERNS) {
    if (searchText.includes(cat)) {
      return cat;
    }
  }
  return '';
}

/**
 * Extracts product information from page content
 * @param {Object} pageContent - Page content data
 * @returns {Object} - Product info with name, price, description, category, url
 */
export function extractProductInfo(pageContent) {
  const info = {
    name: '',
    price: '',
    description: '',
    category: '',
    url: pageContent.url || '',
  };

  // Extract from title
  info.name = pageContent.title || '';

  // Extract from headings
  if (pageContent.elements?.headings?.length > 0) {
    const h1 = pageContent.elements.headings.find((h) => h.level === 'h1');
    if (h1?.text) {
      info.name = h1.text;
    }
  }

  // Extract price from text
  const text = pageContent.text || '';
  info.price = extractPrice(text);

  // Extract description from first few text blocks
  if (pageContent.textBlocks?.length > 0) {
    info.description = pageContent.textBlocks.slice(0, 3).join(' ').substring(0, 500);
  }

  // Detect category
  info.category = detectCategory(info.url, info.name, info.description);

  return info;
}

/**
 * Checks if the current page appears to be a product page
 * @param {Object} pageContent - Page content data
 * @returns {boolean} - True if likely a product page
 */
export function isProductPageContext(pageContent) {
  const url = (pageContent.url || '').toLowerCase();
  const title = (pageContent.title || '').toLowerCase();

  // Check URL patterns common in e-commerce
  if (PRODUCT_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return true;
  }

  // Check for e-commerce site domains
  if (ECOMMERCE_DOMAINS.some((domain) => url.includes(domain))) {
    return true;
  }

  // Check title for product-like patterns (price indicators)
  const pricePattern = /[$€£¥₹₩]\s*[\d,]+|RM\s*[\d,]+/i;
  if (pricePattern.test(title)) {
    return true;
  }

  return false;
}
