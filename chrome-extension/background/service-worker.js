/**
 * Browser Wand Service Worker
 * Main entry point for the Chrome extension background script
 */

console.log('[Browser Wand] Service Worker initializing...');

import { modifyPage } from './handlers/modify-page.js';

console.log('[Browser Wand] Service Worker imports loaded successfully');

const MESSAGE_TYPES = {
  MODIFY_PAGE: 'MODIFY_PAGE',
  EXECUTE_CODE: 'EXECUTE_CODE',
};

/**
 * Executes code in the page's main world using chrome.scripting.executeScript
 * This bypasses page CSP restrictions by injecting a script element into the page
 * @param {number} tabId - The tab ID to execute in
 * @param {string} code - The JavaScript code to execute
 * @returns {Promise<Object>} - Execution result
 */
async function executeCodeInPage(tabId, code) {
  try {
    // Use chrome.scripting.executeScript with a static function that receives code as argument
    // The function creates a script element to execute the code, which bypasses CSP
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      args: [code],
      func: (codeToExecute) => {
        try {
          // Create a script element and inject it into the page
          // This executes in the page's context and bypasses extension CSP
          const script = document.createElement('script');
          script.textContent = codeToExecute;
          document.documentElement.appendChild(script);
          script.remove();
          return { success: true };
        } catch (error) {
          console.error('Browser Wand: Code execution error:', error);
          return { success: false, error: error.message };
        }
      },
    });

    console.log('[Browser Wand] executeCodeInPage results:', results);

    if (results && results.length > 0 && results[0].result) {
      return results[0].result;
    }

    return { success: true };
  } catch (error) {
    console.error('[Browser Wand] executeCodeInPage error:', error);
    return { success: false, error: error.message };
  }
}

const messageHandlers = {
  [MESSAGE_TYPES.MODIFY_PAGE]: modifyPage,
};

/**
 * Routes messages to appropriate handlers
 * @param {Object} message - The message object with type and payload
 * @returns {Promise<Object>} - The handler response
 */
async function handleMessage(message) {
  console.log('[Browser Wand] Service Worker received message:', message.type);

  const handler = messageHandlers[message.type];

  if (!handler) {
    console.warn('[Browser Wand] Unknown message type:', message.type);
    return { success: false, error: 'Unknown message type' };
  }

  try {
    console.log('[Browser Wand] Calling handler for:', message.type);
    const result = await handler(message.payload);
    console.log('[Browser Wand] Handler result:', { success: result.success, hasData: !!result.data, error: result.error });
    return result;
  } catch (error) {
    console.error('[Browser Wand] Handler error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Register message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Browser Wand] Message listener triggered:', message.type, 'from:', sender?.url || 'unknown');

  // Only handle messages that have a type
  if (!message || !message.type) {
    console.warn('[Browser Wand] Received message without type:', message);
    return false;
  }

  // Only handle our specific message types
  if (!MESSAGE_TYPES[message.type]) {
    console.log('[Browser Wand] Ignoring message type:', message.type);
    return false;
  }

  // Handle EXECUTE_CODE specially - it needs the sender's tab ID
  if (message.type === MESSAGE_TYPES.EXECUTE_CODE) {
    (async () => {
      try {
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({ success: false, error: 'No tab ID available' });
          return;
        }
        const result = await executeCodeInPage(tabId, message.payload.code);
        sendResponse(result);
      } catch (error) {
        console.error('[Browser Wand] EXECUTE_CODE error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Handle the message asynchronously
  (async () => {
    try {
      const result = await handleMessage(message);
      console.log('[Browser Wand] Sending response back to popup:', { success: result.success, hasData: !!result.data });
      sendResponse(result);
    } catch (error) {
      console.error('[Browser Wand] Message handling error:', error);
      sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
    }
  })();

  // Return true to indicate we will send a response asynchronously
  return true;
});

console.log('[Browser Wand] Service Worker fully initialized and message listener registered');
