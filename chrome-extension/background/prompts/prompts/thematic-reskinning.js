/**
 * Thematic reskinning prompt
 * AI rewrites CSS/fonts/colors to match a specific mood, era, or theme
 */

import { BASE_RULES } from '../base-rules.js';

export const THEMATIC_RESKINNING_PROMPT = `
${BASE_RULES}

TASK TYPE: Thematic Reskinning
Your goal is to completely transform the visual appearance of the page to match a specific theme, mood, or era while preserving readability and functionality.

APPROACH:
1. Analyze the requested theme/mood (e.g., "cyberpunk", "vintage newspaper", "children's book")
2. Generate comprehensive CSS that transforms ALL visual aspects of the page
3. Use CSS variables for consistent theming across the entire page
4. Apply the theme to all elements: backgrounds, text, borders, shadows, fonts, etc.
5. CRITICAL: Also generate JavaScript code to remove inline styles that would override your CSS

CSS VARIABLE STRUCTURE - Always define these at the :root level:
\`\`\`css
:root {
  /* Primary colors */
  --bw-theme-bg-primary: #colorcode !important;
  --bw-theme-bg-secondary: #colorcode !important;
  --bw-theme-bg-accent: #colorcode !important;

  /* Text colors */
  --bw-theme-text-primary: #colorcode !important;
  --bw-theme-text-secondary: #colorcode !important;
  --bw-theme-text-accent: #colorcode !important;
  --bw-theme-text-heading: #colorcode !important;

  /* Border and accent colors */
  --bw-theme-border: #colorcode !important;
  --bw-theme-border-accent: #colorcode !important;
  --bw-theme-shadow: rgba(r,g,b,a) !important;

  /* Typography */
  --bw-theme-font-body: 'Font Name', fallback !important;
  --bw-theme-font-heading: 'Font Name', fallback !important;
  --bw-theme-font-mono: 'Font Name', monospace !important;

  /* Spacing and sizing */
  --bw-theme-radius: Xpx !important;
  --bw-theme-spacing: Xpx !important;
}
\`\`\`

THEME EXAMPLES:

1. CYBERPUNK / HACKER TERMINAL:
\`\`\`css
:root {
  --bw-theme-bg-primary: #0a0a0a !important;
  --bw-theme-bg-secondary: #1a1a2e !important;
  --bw-theme-bg-accent: #16213e !important;
  --bw-theme-text-primary: #00ff00 !important;
  --bw-theme-text-secondary: #00cc00 !important;
  --bw-theme-text-accent: #ff00ff !important;
  --bw-theme-text-heading: #00ffff !important;
  --bw-theme-border: #00ff00 !important;
  --bw-theme-border-accent: #ff00ff !important;
  --bw-theme-shadow: 0 0 10px rgba(0, 255, 0, 0.5) !important;
  --bw-theme-font-body: 'Courier New', 'Consolas', monospace !important;
  --bw-theme-font-heading: 'Courier New', monospace !important;
  --bw-theme-radius: 0px !important;
}
html {
  background: var(--bw-theme-bg-primary) !important;
  background-image:
    linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px) !important;
  background-size: 20px 20px !important;
}
body {
  background: transparent !important;
  color: var(--bw-theme-text-primary) !important;
  font-family: var(--bw-theme-font-body) !important;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5) !important;
}
* {
  border-color: var(--bw-theme-border) !important;
}
h1, h2, h3, h4, h5, h6 {
  color: var(--bw-theme-text-heading) !important;
  font-family: var(--bw-theme-font-heading) !important;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.7) !important;
  border-bottom: 1px solid var(--bw-theme-border) !important;
}
a {
  color: var(--bw-theme-text-accent) !important;
  text-decoration: none !important;
}
a:hover {
  text-shadow: 0 0 10px var(--bw-theme-text-accent) !important;
}
\`\`\`

2. VINTAGE NEWSPAPER:
\`\`\`css
:root {
  --bw-theme-bg-primary: #f4ecd8 !important;
  --bw-theme-bg-secondary: #e8dcc8 !important;
  --bw-theme-bg-accent: #d4c4a8 !important;
  --bw-theme-text-primary: #2c2416 !important;
  --bw-theme-text-secondary: #4a3f2f !important;
  --bw-theme-text-accent: #8b0000 !important;
  --bw-theme-text-heading: #1a1408 !important;
  --bw-theme-border: #2c2416 !important;
  --bw-theme-border-accent: #8b0000 !important;
  --bw-theme-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1) !important;
  --bw-theme-font-body: 'Times New Roman', 'Georgia', serif !important;
  --bw-theme-font-heading: 'Old Standard TT', 'Times New Roman', serif !important;
  --bw-theme-radius: 0px !important;
}
body {
  background: var(--bw-theme-bg-primary) !important;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E") !important;
  color: var(--bw-theme-text-primary) !important;
  font-family: var(--bw-theme-font-body) !important;
  line-height: 1.6 !important;
}
h1, h2, h3 {
  font-family: var(--bw-theme-font-heading) !important;
  color: var(--bw-theme-text-heading) !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  border-bottom: 3px double var(--bw-theme-border) !important;
  padding-bottom: 8px !important;
}
p {
  text-align: justify !important;
  text-indent: 1.5em !important;
}
a {
  color: var(--bw-theme-text-accent) !important;
  text-decoration: underline !important;
}
img {
  filter: sepia(30%) contrast(1.1) !important;
  border: 1px solid var(--bw-theme-border) !important;
}
\`\`\`

3. CHILDREN'S BOOK / PLAYFUL:
\`\`\`css
:root {
  --bw-theme-bg-primary: #fff5e6 !important;
  --bw-theme-bg-secondary: #ffeaa7 !important;
  --bw-theme-bg-accent: #a8e6cf !important;
  --bw-theme-text-primary: #2d3436 !important;
  --bw-theme-text-secondary: #636e72 !important;
  --bw-theme-text-accent: #e17055 !important;
  --bw-theme-text-heading: #6c5ce7 !important;
  --bw-theme-border: #fdcb6e !important;
  --bw-theme-border-accent: #e17055 !important;
  --bw-theme-shadow: 4px 4px 0 rgba(108, 92, 231, 0.3) !important;
  --bw-theme-font-body: 'Comic Sans MS', 'Chalkboard', cursive !important;
  --bw-theme-font-heading: 'Comic Sans MS', 'Chalkboard', cursive !important;
  --bw-theme-radius: 20px !important;
}
body {
  background: linear-gradient(135deg, #fff5e6 0%, #ffeaa7 50%, #a8e6cf 100%) !important;
  color: var(--bw-theme-text-primary) !important;
  font-family: var(--bw-theme-font-body) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}
h1, h2, h3, h4 {
  color: var(--bw-theme-text-heading) !important;
  font-family: var(--bw-theme-font-heading) !important;
  text-shadow: 2px 2px 0 #fdcb6e !important;
}
a {
  color: var(--bw-theme-text-accent) !important;
  font-weight: bold !important;
  text-decoration: wavy underline !important;
}
p {
  background: rgba(255, 255, 255, 0.7) !important;
  padding: 16px !important;
  border-radius: var(--bw-theme-radius) !important;
  margin: 16px 0 !important;
  box-shadow: var(--bw-theme-shadow) !important;
}
img {
  border-radius: var(--bw-theme-radius) !important;
  border: 4px solid var(--bw-theme-border) !important;
  box-shadow: var(--bw-theme-shadow) !important;
}
\`\`\`

COMPREHENSIVE ELEMENT TARGETING:
Always apply theme to these elements:
\`\`\`css
/* Reset and base */
*, *::before, *::after {
  border-color: var(--bw-theme-border) !important;
}

/* Typography */
body, p, span, div, li, td, th {
  color: var(--bw-theme-text-primary) !important;
  font-family: var(--bw-theme-font-body) !important;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--bw-theme-text-heading) !important;
  font-family: var(--bw-theme-font-heading) !important;
}

/* Links */
a, a:visited {
  color: var(--bw-theme-text-accent) !important;
}

/* Backgrounds */
body, main, article, section, aside, header, footer, nav {
  background-color: var(--bw-theme-bg-primary) !important;
}

div[class*="container"], div[class*="wrapper"], div[class*="content"] {
  background-color: var(--bw-theme-bg-secondary) !important;
}

/* Forms and inputs */
input, textarea, select, button {
  background-color: var(--bw-theme-bg-secondary) !important;
  color: var(--bw-theme-text-primary) !important;
  border: 1px solid var(--bw-theme-border) !important;
  border-radius: var(--bw-theme-radius) !important;
  font-family: var(--bw-theme-font-body) !important;
}

/* Code blocks */
pre, code {
  background-color: var(--bw-theme-bg-accent) !important;
  color: var(--bw-theme-text-primary) !important;
  font-family: var(--bw-theme-font-mono) !important;
  border-radius: var(--bw-theme-radius) !important;
}

/* Tables */
table, tr, td, th {
  border-color: var(--bw-theme-border) !important;
  background-color: var(--bw-theme-bg-secondary) !important;
}

/* Blockquotes */
blockquote {
  border-left-color: var(--bw-theme-border-accent) !important;
  background-color: var(--bw-theme-bg-secondary) !important;
  color: var(--bw-theme-text-secondary) !important;
}
\`\`\`

JAVASCRIPT CODE - ALWAYS generate this code to ensure the theme applies correctly:
\`\`\`javascript
(function() {
  // Remove inline styles that would override our theme CSS
  const elementsToClean = document.querySelectorAll('*');
  const stylePropertiesToRemove = ['background', 'background-color', 'color', 'border', 'border-color', 'font-family', 'font-size'];

  elementsToClean.forEach(el => {
    if (el.style) {
      stylePropertiesToRemove.forEach(prop => {
        if (el.style[prop] || el.style.getPropertyValue(prop)) {
          el.style.removeProperty(prop);
          el.style.removeProperty(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
        }
      });
    }
  });

  // Add theme class to body for additional targeting
  document.body.classList.add('bw-themed');
  document.documentElement.classList.add('bw-themed');

  // Force reflow to ensure styles are applied
  document.body.offsetHeight;

  console.log('[Browser Wand] Thematic reskinning applied - inline styles cleaned');
})();
\`\`\`

CRITICAL INSTRUCTIONS:
1. ALWAYS generate BOTH comprehensive CSS AND the JavaScript code above
2. The JavaScript code is ESSENTIAL - without it, inline styles will override your CSS theme
3. Use CSS custom properties (variables) for maintainability
4. Apply !important to ALL rules to override existing styles
5. Include background patterns, textures, or gradients when appropriate for the theme
6. Transform images with CSS filters (sepia, grayscale, etc.) if it fits the theme
7. Ensure text remains readable - maintain sufficient contrast
8. Apply consistent border-radius and shadow styles throughout
9. Include hover states for interactive elements
10. Consider adding subtle animations if they fit the theme (but keep them minimal)
11. NEVER return empty "code" field - always include the inline style removal JavaScript`;
