(() => {
  const STORAGE_KEY = 'browserWandOriginalStyles';
  const INJECTED_STYLE_ID = 'browser-wand-injected-styles';

  let originalStates = new Map();
  let appliedModifications = {
    code: [],
    css: []
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_CONTENT':
        sendResponse(getPageContent());
        break;
      case 'GET_MODIFICATION_STATE':
        sendResponse({
          hasModifications: appliedModifications.code.length > 0 || appliedModifications.css.length > 0,
          appliedCode: appliedModifications.code,
          appliedCss: appliedModifications.css
        });
        break;
      case 'APPLY_MODIFICATIONS':
        // Handle async applyModifications
        (async () => {
          try {
            const result = await applyModifications(message.payload);
            sendResponse(result);
          } catch (error) {
            console.error('Browser Wand: APPLY_MODIFICATIONS error:', error);
            sendResponse({ success: false, error: error.message });
          }
        })();
        return true; // Keep the message channel open for async response
      case 'RESET_MODIFICATIONS':
        resetModifications();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
    return true;
  });

  function getPageContent() {
    const content = {
      url: window.location.href,
      title: document.title,
      html: getSimplifiedHTML(),
      text: getVisibleText(),
      elements: getElementsSummary(),
      textBlocks: getTextBlocks()
    };
    return content;
  }

  function getTextBlocks() {
    const blocks = [];
    const contentSelectors = [
      '[itemprop="articleBody"]', 'article', 'main', '[role="main"]',
      '[class*="article-content"]', '[class*="post-content"]', '[class*="entry-content"]',
      '[class*="story-body"]', '[class*="article-body"]'
    ];

    let mainContent = null;
    for (const selector of contentSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el && (el.textContent || '').trim().length > 300) {
          mainContent = el;
          break;
        }
      } catch (e) {}
    }

    if (!mainContent) {
      mainContent = document.body;
    }

    const paragraphs = mainContent.querySelectorAll('p');
    paragraphs.forEach((p, i) => {
      if (i >= 30) return;
      const text = p.textContent?.trim();
      if (text && text.length > 50 && text.length < 2000) {
        const isHidden = window.getComputedStyle(p).display === 'none' ||
                         window.getComputedStyle(p).visibility === 'hidden';
        if (!isHidden) {
          blocks.push(text);
        }
      }
    });

    return blocks;
  }

  function getSimplifiedHTML() {
    const clone = document.body.cloneNode(true);

    const scriptsAndStyles = clone.querySelectorAll('script, style, noscript, svg, iframe');
    scriptsAndStyles.forEach(el => el.remove());

    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      const attributesToKeep = ['id', 'class', 'href', 'src', 'alt', 'title', 'type', 'name', 'placeholder', 'value'];
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        if (!attributesToKeep.includes(attr.name) && !attr.name.startsWith('data-')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    let html = clone.innerHTML;
    html = html.replace(/\s+/g, ' ').trim();

    if (html.length > 80000) {
      html = html.substring(0, 80000) + '... [truncated]';
    }

    return html;
  }

  function getVisibleText() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          const text = node.textContent.trim();
          if (text.length === 0) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const texts = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim();
      if (text) texts.push(text);
    }

    let result = texts.join(' ');
    if (result.length > 10000) {
      result = result.substring(0, 10000) + '... [truncated]';
    }

    return result;
  }

  function getElementsSummary() {
    const summary = {
      buttons: [],
      links: [],
      inputs: [],
      images: [],
      headings: [],
      divs: { count: 0 },
      spans: { count: 0 },
      semanticStructure: {},
      suspectedAds: [],
      suspectedComments: [],
      mainContentCandidates: []
    };

    document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((el, i) => {
      if (i < 20) {
        summary.buttons.push({
          text: el.textContent?.trim().substring(0, 50) || el.value || '',
          id: el.id || null,
          classes: el.className || null
        });
      }
    });

    document.querySelectorAll('a[href]').forEach((el, i) => {
      if (i < 20) {
        summary.links.push({
          text: el.textContent?.trim().substring(0, 50) || '',
          href: el.href?.substring(0, 100) || '',
          id: el.id || null,
          classes: el.className || null
        });
      }
    });

    document.querySelectorAll('input, textarea, select').forEach((el, i) => {
      if (i < 20) {
        summary.inputs.push({
          type: el.type || el.tagName.toLowerCase(),
          name: el.name || null,
          id: el.id || null,
          placeholder: el.placeholder || null,
          classes: el.className || null
        });
      }
    });

    document.querySelectorAll('img').forEach((el, i) => {
      if (i < 10) {
        summary.images.push({
          alt: el.alt || '',
          src: el.src?.substring(0, 100) || '',
          id: el.id || null,
          classes: el.className || null
        });
      }
    });

    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el, i) => {
      if (i < 15) {
        summary.headings.push({
          level: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 100) || '',
          id: el.id || null,
          classes: el.className || null
        });
      }
    });

    summary.divs.count = document.querySelectorAll('div').length;
    summary.spans.count = document.querySelectorAll('span').length;

    summary.semanticStructure = getSemanticStructure();
    summary.suspectedAds = getSuspectedAds();
    summary.suspectedComments = getSuspectedComments();
    summary.mainContentCandidates = getMainContentCandidates();

    return summary;
  }

  function getSemanticStructure() {
    const structure = {
      header: [],
      nav: [],
      main: [],
      article: [],
      section: [],
      aside: [],
      footer: []
    };

    const semanticTags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];

    semanticTags.forEach(tag => {
      document.querySelectorAll(tag).forEach((el, i) => {
        if (i < 5) {
          structure[tag].push({
            id: el.id || null,
            classes: el.className || null,
            selector: generateUniqueSelector(el),
            textPreview: el.textContent?.trim().substring(0, 100) || '',
            childCount: el.children.length
          });
        }
      });
    });

    return structure;
  }

  function getSuspectedAds() {
    // More precise selectors to avoid false positives
    const adSelectors = [
      // Google AdSense (high confidence)
      '.adsbygoogle', 'ins.adsbygoogle', '[id^="google_ads"]', '[id^="div-gpt-ad"]',
      // Data attributes (high confidence)
      '[data-ad]', '[data-ads]', '[data-ad-slot]', '[data-ad-unit]', '[data-ad-client]',
      '[data-adunit]', '[data-dfp]', '[data-google-query-id]',
      // Class patterns - use start/end anchors to avoid "download", "gradient" etc
      '[class^="ad-"]', '[class^="ads-"]', '[class*=" ad-"]', '[class*=" ads-"]',
      '[class$="-ad"]', '[class$="-ads"]',
      '[class*="advert"]', '[class*="Advert"]', '[class*="advertisement"]',
      // ID patterns - use start/end anchors for precision
      '[id^="ad-"]', '[id^="ads-"]', '[id*="-ad-"]', '[id*="-ads-"]',
      '[id$="-ad"]', '[id$="-ads"]', '[id*="advert"]', '[id*="advertisement"]',
      // Sponsored content
      '[class*="sponsor"]', '[class*="Sponsor"]',
      // Iframes with ad sources
      'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]', 'iframe[src*="googleadservices"]',
      'iframe[src*="adserver"]', 'iframe[src*="adservice"]',
      // Third-party ad networks
      '[class*="outbrain"]', '[class*="taboola"]', '.OUTBRAIN', '.taboola-widget',
      // Aria labels
      '[aria-label*="advertisement"]', '[aria-label*="Advertisement"]',
      '[aria-label*="sponsored"]', '[aria-label*="Sponsored"]',
      // DFP/GPT
      '[class*="dfp"]', '[class*="gpt-ad"]', '[class*="GoogleActiveViewElement"]',
      // AMP ads
      'amp-ad', 'amp-embed[type="ad"]', 'amp-sticky-ad',
      // Sticky/floating ads
      '[class*="sticky-ad"]', '[class*="stickyAd"]', '[class*="fixed-ad"]', '[class*="fixedAd"]',
      '[class*="floating-ad"]', '[class*="floatingAd"]',
      // Interstitials
      '[class*="interstitial"]', '[class*="Interstitial"]', '[id*="interstitial"]',
    ];

    // Patterns to exclude (false positives)
    const excludePatterns = [
      /^add[-_]/i, /[-_]add$/i,  // add-button, btn-add
      /download/i, /upload/i, /gradient/i, /shadow/i, /padding/i,
      /loading/i, /heading/i, /reading/i, /leading/i, /trading/i,
    ];

    const ads = [];
    const seen = new Set();

    adSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          const uniqueSelector = generateUniqueSelector(el);
          if (seen.has(uniqueSelector) || ads.length >= 30) return;

          // Check for false positives
          const identifier = ((el.className || '') + ' ' + (el.id || '')).toLowerCase();
          const isFalsePositive = excludePatterns.some(p => p.test(identifier));
          if (isFalsePositive) return;

          seen.add(uniqueSelector);
          ads.push({
            selector: uniqueSelector,
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            classes: el.className || null,
            matchedPattern: selector
          });
        });
      } catch (e) {}
    });

    return ads;
  }

  function getSuspectedComments() {
    const commentSelectors = [
      '[class*="comment"]', '[id*="comment"]',
      '[class*="disqus"]', '[id*="disqus"]',
      '[class*="discussion"]', '[id*="discussion"]',
      '[class*="reply"]', '[class*="replies"]',
      '[data-component="comments"]', '[data-testid*="comment"]',
      '.comments-section', '.comment-thread', '.user-comments',
      '#comments', '#comment-section', '#disqus_thread'
    ];

    const comments = [];
    const seen = new Set();

    commentSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          const uniqueSelector = generateUniqueSelector(el);
          if (!seen.has(uniqueSelector) && comments.length < 20) {
            seen.add(uniqueSelector);
            comments.push({
              selector: uniqueSelector,
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              classes: el.className || null,
              matchedPattern: selector
            });
          }
        });
      } catch (e) {}
    });

    return comments;
  }

  function getMainContentCandidates() {
    const candidates = [];

    const mainEl = document.querySelector('main');
    if (mainEl) {
      candidates.push({
        type: 'main',
        selector: generateUniqueSelector(mainEl),
        id: mainEl.id || null,
        classes: mainEl.className || null
      });
    }

    const articleEl = document.querySelector('article');
    if (articleEl) {
      candidates.push({
        type: 'article',
        selector: generateUniqueSelector(articleEl),
        id: articleEl.id || null,
        classes: articleEl.className || null
      });
    }

    const contentSelectors = [
      // Schema.org attributes (most reliable)
      '[itemprop="articleBody"]', '[itemprop="mainContentOfPage"]',
      // Data attributes
      '[data-testid*="article-body"]', '[data-testid*="article-content"]',
      '[data-component*="article-body"]', '[data-story-body]',
      // Straits Times specific patterns
      '[class*="article-content-rawhtml"]', '[class*="group-story-body"]',
      '.str-article-body', '[class*="st-article"]',
      // General content patterns
      '[class*="content"]', '[class*="article"]', '[class*="post"]', '[class*="entry"]',
      '[class*="story"]', '[class*="body"]', '[class*="text"]',
      '[id*="content"]', '[id*="article"]', '[id*="post"]', '[id*="entry"]',
      '[id*="story"]', '[id*="main"]',
      '[role="main"]', '[role="article"]',
      // CamelCase patterns
      '[class*="ArticleBody"]', '[class*="StoryBody"]', '[class*="ArticleContent"]'
    ];

    const seen = new Set();
    contentSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          const textLength = el.textContent?.trim().length || 0;
          if (textLength > 500 && candidates.length < 10) {
            const uniqueSelector = generateUniqueSelector(el);
            if (!seen.has(uniqueSelector)) {
              seen.add(uniqueSelector);
              candidates.push({
                type: 'contentCandidate',
                selector: uniqueSelector,
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                classes: el.className || null,
                textLength: textLength,
                matchedPattern: selector
              });
            }
          }
        });
      } catch (e) {}
    });

    candidates.sort((a, b) => (b.textLength || 0) - (a.textLength || 0));

    return candidates.slice(0, 10);
  }

  function generateUniqueSelector(el) {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }

    const path = [];
    let current = el;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c && !c.match(/^(js-|is-|has-)/));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).map(c => CSS.escape(c)).join('.');
        }
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  async function applyModifications(payload) {
    saveOriginalStates();

    let cssApplied = false;
    let codeExecuted = false;

    if (payload.css) {
      appendCSS(payload.css);
      appliedModifications.css.push(payload.css);
      cssApplied = true;
    }

    if (payload.code) {
      codeExecuted = await executeCode(payload.code);
      if (codeExecuted) {
        appliedModifications.code.push(payload.code);
      }
    }

    cleanupEmptySpaces();

    return {
      success: cssApplied || codeExecuted,
      cssApplied,
      codeExecuted,
      error: !codeExecuted && payload.code ? 'Code execution failed - page may have strict Content Security Policy' : null
    };
  }

  /**
   * Executes modification code using chrome.scripting.executeScript via service worker
   * This bypasses page CSP restrictions
   * @returns {Promise<boolean>} - Whether code execution succeeded
   */
  async function executeCode(code) {
    try {
      // Send code to service worker for execution via chrome.scripting.executeScript
      // This bypasses CSP because it uses the extension's privileges
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_CODE',
        payload: { code }
      });

      if (response && response.success) {
        console.log('Browser Wand: Code executed via service worker');
        return true;
      } else {
        console.error('Browser Wand: Service worker execution failed:', response?.error);
        return false;
      }
    } catch (error) {
      console.error('Browser Wand: Failed to send code to service worker:', error.message);
      return false;
    }
  }

  function cleanupEmptySpaces() {
    setTimeout(() => {
      const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
      hiddenElements.forEach(el => {
        if (el.parentElement) {
          const rect = el.getBoundingClientRect();
          if (rect.height === 0 || rect.width === 0) {
            el.style.margin = '0';
            el.style.padding = '0';
          }
        }
      });
    }, 100);
  }

  function saveOriginalStates() {
    if (originalStates.size > 0) return;

    const allElements = document.querySelectorAll('*');
    allElements.forEach((el, index) => {
      el.setAttribute('data-bw-index', index);
      originalStates.set(index, {
        style: el.getAttribute('style') || '',
        className: el.className,
        innerHTML: null
      });
    });
  }

  function appendCSS(css) {
    let styleEl = document.getElementById(INJECTED_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = INJECTED_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    if (styleEl.textContent) {
      styleEl.textContent += '\n' + css;
    } else {
      styleEl.textContent = css;
    }
  }

  function resetModifications() {
    const styleEl = document.getElementById(INJECTED_STYLE_ID);
    if (styleEl) {
      styleEl.remove();
    }

    originalStates.forEach((state, index) => {
      const el = document.querySelector(`[data-bw-index="${index}"]`);
      if (el) {
        if (state.style) {
          el.setAttribute('style', state.style);
        } else {
          el.removeAttribute('style');
        }
        el.className = state.className;
        el.removeAttribute('data-bw-index');
      }
    });

    originalStates.clear();
    appliedModifications.code = [];
    appliedModifications.css = [];

    window.location.reload();
  }
})();
