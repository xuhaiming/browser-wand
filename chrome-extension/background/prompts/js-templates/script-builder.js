/**
 * Script builder utilities for generating injectable JavaScript
 * Provides a fluent API for constructing executable scripts
 */

// ============================================================================
// Core Wrappers
// ============================================================================

/**
 * Wraps code in an IIFE (Immediately Invoked Function Expression)
 */
export function wrapInIIFE(code, useStrict = false) {
  const strictDirective = useStrict ? "'use strict';\n\n" : '';
  return `(function() {\n${strictDirective}${code}\n})();`;
}

/**
 * Wraps code in an async IIFE
 */
export function wrapInAsyncIIFE(code, useStrict = false) {
  const strictDirective = useStrict ? "'use strict';\n\n" : '';
  return `(async function() {\n${strictDirective}${code}\n})();`;
}

// ============================================================================
// Constant Declarations
// ============================================================================

/**
 * Creates a constant declaration from a value
 */
export function createConstant(name, value) {
  return `const ${name} = ${JSON.stringify(value, null, 2)};`;
}

/**
 * Creates a constant declaration with raw value (no JSON serialization)
 */
export function createRawConstant(name, rawValue) {
  return `const ${name} = ${rawValue};`;
}

/**
 * Creates multiple constant declarations
 */
export function createConstants(constants) {
  return Object.entries(constants)
    .map(([name, value]) => createConstant(name, value))
    .join('\n\n');
}

// ============================================================================
// Script Building
// ============================================================================

/**
 * Builds a script with constants and code sections
 */
export function buildScript({ constants = {}, sections = [], useStrict = false, async = false }) {
  const parts = [];

  if (Object.keys(constants).length > 0) {
    parts.push(createConstants(constants));
  }

  parts.push(...sections.filter(Boolean));

  const wrapper = async ? wrapInAsyncIIFE : wrapInIIFE;
  return wrapper(parts.join('\n\n'), useStrict);
}

/**
 * Fluent script builder class for complex scripts
 */
export class ScriptBuilder {
  constructor() {
    this._constants = {};
    this._functions = [];
    this._sections = [];
    this._useStrict = false;
    this._async = false;
  }

  static create() {
    return new ScriptBuilder();
  }

  useStrict(value = true) {
    this._useStrict = value;
    return this;
  }

  async(value = true) {
    this._async = value;
    return this;
  }

  constant(name, value) {
    this._constants[name] = value;
    return this;
  }

  constants(obj) {
    Object.assign(this._constants, obj);
    return this;
  }

  rawConstant(name, rawValue) {
    this._sections.unshift(createRawConstant(name, rawValue));
    return this;
  }

  func(code) {
    this._functions.push(code);
    return this;
  }

  section(code) {
    if (code) this._sections.push(code);
    return this;
  }

  sections(...codes) {
    codes.filter(Boolean).forEach((code) => this._sections.push(code));
    return this;
  }

  build() {
    return buildScript({
      constants: this._constants,
      sections: [...this._functions, ...this._sections],
      useStrict: this._useStrict,
      async: this._async,
    });
  }
}

// ============================================================================
// Style Injection
// ============================================================================

/**
 * Injects CSS into the page
 */
export function injectStyleCode(css, id) {
  return `
const style = document.createElement('style');
style.id = '${id}';
style.textContent = \`${css}\`;
document.head.appendChild(style);`.trim();
}

/**
 * Converts a style object to CSS string
 */
export function stylesToCSS(styles) {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}:${value}`;
    })
    .join(';');
}

// ============================================================================
// Observer and Timing
// ============================================================================

/**
 * Creates a MutationObserver setup
 */
export function createObserverCode(callbackName, options = {}) {
  const { childList = true, subtree = true, attributes = false } = options;

  return `
const observer = new MutationObserver(${callbackName});
observer.observe(document.body, {
  childList: ${childList},
  subtree: ${subtree},
  attributes: ${attributes}
});`.trim();
}

/**
 * Creates a generic observer callback
 */
export function createObserverCallback(name, checkFn, processFn, options = {}) {
  const { logMessage = 'Processed elements' } = options;

  return `
function ${name}(mutations) {
  let count = 0;
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (${checkFn}(node)) {
          ${processFn}(node);
          count++;
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('*').forEach(child => {
            if (${checkFn}(child)) {
              ${processFn}(child);
              count++;
            }
          });
        }
      }
    });
  });
  if (count > 0) {
    console.log('[Browser Wand] ${logMessage}:', count);
  }
}`;
}

/**
 * Creates a delayed execution wrapper
 */
export function delayedExecution(code, delay) {
  return `setTimeout(() => {\n${code}\n}, ${delay});`;
}

/**
 * Creates requestAnimationFrame wrapper
 */
export function rafExecution(code) {
  return `requestAnimationFrame(() => {\n${code}\n});`;
}

// ============================================================================
// Logging
// ============================================================================

/**
 * Creates a console log statement with prefix
 */
export function createLog(message, prefix = 'Browser Wand', level = 'log') {
  return `console.${level}('[${prefix}] ${message}');`;
}

// ============================================================================
// Element Creation
// ============================================================================

/**
 * Creates element creation and styling code
 */
export function createElementCode({
  tagName,
  varName,
  attributes = {},
  styles = {},
  textContent = null,
  innerHTML = null,
  className = null,
  id = null,
}) {
  const lines = [`const ${varName} = document.createElement('${tagName}');`];

  if (id) {
    lines.push(`${varName}.id = '${id}';`);
  }

  if (className) {
    lines.push(`${varName}.className = '${className}';`);
  }

  if (textContent !== null) {
    lines.push(`${varName}.textContent = ${JSON.stringify(textContent)};`);
  }

  if (innerHTML !== null) {
    lines.push(`${varName}.innerHTML = ${JSON.stringify(innerHTML)};`);
  }

  for (const [attr, value] of Object.entries(attributes)) {
    lines.push(`${varName}.setAttribute('${attr}', ${JSON.stringify(value)});`);
  }

  if (Object.keys(styles).length > 0) {
    lines.push(`${varName}.style.cssText = '${stylesToCSS(styles)}';`);
  }

  return lines.join('\n');
}

/**
 * Creates code to query and iterate over elements
 */
export function createForEach(selector, callback, options = {}) {
  const { varName = 'el', useTryCatch = true } = options;
  const code = `document.querySelectorAll('${selector}').forEach(${varName} => {\n${callback}\n});`;
  return useTryCatch ? `try {\n${code}\n} catch (e) { console.error('Invalid selector:', '${selector}'); }` : code;
}

/**
 * Creates code to find an element with fallback
 */
export function createQueryWithFallback(selectors, varName = 'target') {
  const selectorStr = Array.isArray(selectors) ? selectors.join(', ') : selectors;
  return `const ${varName} = document.querySelector('${selectorStr}') || document.body;`;
}

// ============================================================================
// Template Processing
// ============================================================================

/**
 * Replaces placeholders in a template string
 */
export function replacePlaceholders(template, replacements) {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `__${key}__`;
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    result = result.replace(new RegExp(placeholder, 'g'), serializedValue);
  }
  return result;
}

/**
 * Creates a function definition
 */
export function createFunction(name, params, body) {
  const paramStr = Array.isArray(params) ? params.join(', ') : params;
  return `function ${name}(${paramStr}) {\n${body}\n}`;
}

/**
 * Creates a conditional block
 */
export function createConditional(condition, thenBlock, elseBlock = null) {
  let code = `if (${condition}) {\n${thenBlock}\n}`;
  if (elseBlock) {
    code += ` else {\n${elseBlock}\n}`;
  }
  return code;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Joins code sections with blank lines
 */
export function joinSections(...sections) {
  return sections.filter(Boolean).join('\n\n');
}

/**
 * Indents code by specified number of spaces
 */
export function indent(code, spaces = 2) {
  const indentation = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.trim() ? indentation + line : line))
    .join('\n');
}
