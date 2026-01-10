const DEFAULT_API_KEY = '9b6ecfa8-c757-4a51-ac75-e460a80ca69b';
const SAVED_SCRIPTS_KEY = 'browserWandSavedScripts';
const DEFAULT_MODEL = 'gemini-3-pro-preview';

// Script categories from config.js
const SCRIPT_CATEGORIES = {
  STATIC_SCRIPT: 'STATIC_SCRIPT',
  RUNTIME_LLM: 'RUNTIME_LLM',
  SAVABLE_RUNTIME: 'SAVABLE_RUNTIME',
};

document.addEventListener('DOMContentLoaded', () => {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const apiKeyInput = document.getElementById('apiKey');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const userPromptInput = document.getElementById('userPrompt');
  const modifyBtn = document.getElementById('modifyBtn');
  const modifyBtnText = modifyBtn.querySelector('.btn-text');
  const modifyBtnIconDefault = modifyBtn.querySelector('.btn-icon-default');
  const modifyBtnIconLoading = modifyBtn.querySelector('.btn-icon-loading');
  const resetBtn = document.getElementById('resetBtn');
  const statusBar = document.getElementById('statusBar');
  const statusBarIcon = document.getElementById('statusBarIcon');
  const statusBarText = document.getElementById('statusBarText');
  const appMain = document.querySelector('.app-main');
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const saveScriptBtn = document.getElementById('saveScriptBtn');
  const savedScriptsToggle = document.getElementById('savedScriptsToggle');
  const savedScriptsPanel = document.getElementById('savedScriptsPanel');
  const savedScriptsList = document.getElementById('savedScriptsList');
  const savedScriptsCount = document.getElementById('savedScriptsCount');
  const saveScriptModal = document.getElementById('saveScriptModal');
  const scriptNameInput = document.getElementById('scriptNameInput');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const modalBackdrop = saveScriptModal.querySelector('.modal-backdrop');
  const magicBarInput = document.getElementById('magicBarInput');
  const magicBarBtn = document.getElementById('magicBarBtn');
  const magicSuggestions = document.querySelectorAll('.chip');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const startFocusBtn = document.getElementById('startFocusBtn');
  const stopFocusBtn = document.getElementById('stopFocusBtn');
  const focusStatus = document.getElementById('focusStatus');

  // Store the last successful modification for saving
  let lastModificationData = null;
  let lastPrompt = '';

  loadSettings();
  loadSavedScripts();
  checkFocusModeStatus();

  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('collapsed');
  });

  savedScriptsToggle.addEventListener('click', () => {
    savedScriptsPanel.classList.toggle('hidden');
  });

  saveSettingsBtn.addEventListener('click', saveSettings);
  modifyBtn.addEventListener('click', handleModify);
  resetBtn.addEventListener('click', handleReset);
  magicBarBtn.addEventListener('click', handleMagicBarSearch);
  magicBarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleMagicBarSearch();
    }
  });
  magicSuggestions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      magicBarInput.value = query;
      handleMagicBarSearch();
    });
  });
  startFocusBtn.addEventListener('click', handleStartFocus);
  stopFocusBtn.addEventListener('click', handleStopFocus);
  saveScriptBtn.addEventListener('click', openSaveModal);
  cancelSaveBtn.addEventListener('click', closeSaveModal);
  confirmSaveBtn.addEventListener('click', handleSaveScript);
  modalBackdrop.addEventListener('click', closeSaveModal);
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeSaveModal);
  }
  scriptNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveScript();
    } else if (e.key === 'Escape') {
      closeSaveModal();
    }
  });

  async function loadSettings() {
    const result = await chrome.storage.local.get(['apiKey', 'model']);
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    const savedModel = result.model || DEFAULT_MODEL;
    const modelRadio = document.querySelector(`input[name="model"][value="${savedModel}"]`);
    if (modelRadio) {
      modelRadio.checked = true;
    }
  }

  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = document.querySelector('input[name="model"]:checked')?.value || DEFAULT_MODEL;
    await chrome.storage.local.set({ apiKey, model: selectedModel });
    showStatus('success', 'Settings saved!', '');
    setTimeout(() => hideStatus(), 2000);
  }

  function getApiKey() {
    return apiKeyInput.value.trim() || DEFAULT_API_KEY;
  }

  function getSelectedModel() {
    return document.querySelector('input[name="model"]:checked')?.value || DEFAULT_MODEL;
  }

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function handleModify() {
    const prompt = userPromptInput.value.trim();
    if (!prompt) {
      showStatus('error', 'Please enter a prompt', 'Describe what modifications you want to make.');
      return;
    }

    setButtonsDisabled(true);
    showStatus('loading', 'Modifying page...', 'Reading page content...');

    try {
      const tab = await getCurrentTab();
      console.log('[Browser Wand Popup] Getting page content from tab:', tab.id);
      const pageContent = await getPageContent(tab.id);
      console.log('[Browser Wand Popup] Page content received:', {
        hasContent: !!pageContent,
        keys: pageContent ? Object.keys(pageContent) : null
      });
      const modificationState = await getModificationState(tab.id);
      console.log('[Browser Wand Popup] Modification state received:', modificationState);

      showStatus('loading', 'Modifying page...', 'Generating modification...');

      console.log('[Browser Wand Popup] Sending MODIFY_PAGE message to service worker...');

      // Send message with timeout handling
      const sendMessageWithTimeout = (message, timeoutMs = 120000) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Request timed out. The AI service might be slow or unavailable.'));
          }, timeoutMs);

          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      const response = await sendMessageWithTimeout({
        type: 'MODIFY_PAGE',
        payload: {
          apiKey: getApiKey(),
          prompt,
          pageContent,
          previousModifications: modificationState,
          model: getSelectedModel()
        }
      });

      console.log('[Browser Wand Popup] Response from service worker:', response);

      if (!response) {
        console.error('[Browser Wand Popup] No response received from service worker');
        throw new Error('No response from service worker. Please try reloading the extension.');
      }

      if (response.success) {
        console.log('[Browser Wand Popup] Modification successful, applying changes...');
        console.log('[Browser Wand Popup] Code to apply:', response.data.code?.substring(0, 200));
        showStatus('loading', 'Modifying page...', 'Applying changes...');

        const applyResult = await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_MODIFICATIONS',
          payload: {
            code: response.data.code,
            css: response.data.css
          }
        });

        console.log('[Browser Wand Popup] Apply result:', applyResult);

        // Check if any modifications were actually applied
        const hasCode = response.data.code && response.data.code.trim().length > 0;
        const hasCss = response.data.css && response.data.css.trim().length > 0;
        const hasModifications = hasCode || hasCss;

        if (applyResult && applyResult.success && hasModifications) {
          showStatus('success', 'Modifications applied!', '');
          showResult(response.data.explanation, response.data);

          // Store for potential saving
          lastModificationData = response.data;
          lastPrompt = prompt;
        } else if (applyResult && applyResult.error) {
          showStatus('error', 'Application failed', applyResult.error);
        } else if (!hasModifications) {
          // No code or CSS was generated - likely a parsing issue
          showStatus('error', 'No modifications generated', 'The AI response could not be parsed. Please try rephrasing your request.');
          console.error('[Browser Wand Popup] No code or CSS generated. Response explanation:', response.data.explanation?.substring(0, 500));
        } else {
          showStatus('success', 'Modifications applied!', '');
          showResult(response.data.explanation, response.data);

          // Store for potential saving
          lastModificationData = response.data;
          lastPrompt = prompt;
        }
      } else {
        console.error('[Browser Wand Popup] Modification failed:', response.error);
        showStatus('error', 'Modification failed', response.error);
      }
    } catch (error) {
      console.error('[Browser Wand Popup] Error in handleModify:', error);
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function handleReset() {
    setButtonsDisabled(true);
    showStatus('loading', 'Resetting changes...', '');

    try {
      const tab = await getCurrentTab();
      await chrome.tabs.sendMessage(tab.id, { type: 'RESET_MODIFICATIONS' });
      showStatus('success', 'Changes reset!', 'Page restored to original state.');
      hideResult();
      lastModificationData = null;
      lastPrompt = '';
    } catch (error) {
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function handleMagicBarSearch() {
    const searchQuery = magicBarInput.value.trim();
    if (!searchQuery) {
      showStatus('error', 'Please enter a search query', 'Type what you want to search for.');
      magicBarInput.focus();
      return;
    }

    setButtonsDisabled(true);
    showStatus('loading', 'Magic Bar Searching...', 'Connecting to AI-powered search...');

    try {
      const tab = await getCurrentTab();
      console.log('[Browser Wand Popup] Magic Bar search:', searchQuery);
      const pageContent = await getPageContent(tab.id);

      showStatus('loading', 'Magic Bar Searching...', 'Searching the web...');

      const sendMessageWithTimeout = (message, timeoutMs = 120000) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Request timed out. The search might be slow or unavailable.'));
          }, timeoutMs);

          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      };

      const response = await sendMessageWithTimeout({
        type: 'MODIFY_PAGE',
        payload: {
          apiKey: getApiKey(),
          prompt: searchQuery,
          pageContent,
          previousModifications: null,
          model: getSelectedModel()
        }
      });

      if (!response) {
        throw new Error('No response from service worker. Please try reloading the extension.');
      }

      if (response.success) {
        showStatus('loading', 'Magic Bar Searching...', 'Displaying results...');

        const applyResult = await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_MODIFICATIONS',
          payload: {
            code: response.data.code,
            css: response.data.css
          }
        });

        // Check if any modifications were actually applied
        const hasMagicCode = response.data.code && response.data.code.trim().length > 0;
        const hasMagicCss = response.data.css && response.data.css.trim().length > 0;
        const hasMagicModifications = hasMagicCode || hasMagicCss;

        if (applyResult && applyResult.success && hasMagicModifications) {
          showStatus('success', 'Search complete!', '');
          showResult(response.data.explanation, response.data);
        } else if (applyResult && applyResult.error) {
          showStatus('error', 'Display failed', applyResult.error);
        } else if (!hasMagicModifications) {
          showStatus('error', 'Search failed', 'Could not display search results. Please try again.');
          console.error('[Browser Wand Popup] Magic bar: No code or CSS generated.');
        } else {
          showStatus('success', 'Search complete!', '');
          showResult(response.data.explanation, response.data);
        }
      } else {
        showStatus('error', 'Search failed', response.error);
      }
    } catch (error) {
      console.error('[Browser Wand Popup] Error in handleMagicBarSearch:', error);
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function checkFocusModeStatus() {
    try {
      const tab = await getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FOCUS_STATUS' });

      if (response && response.isActive) {
        updateFocusUI(true);
      } else {
        updateFocusUI(false);
      }
    } catch (error) {
      // Content script may not be loaded yet
      updateFocusUI(false);
    }
  }

  function updateFocusUI(isActive) {
    if (isActive) {
      startFocusBtn.classList.add('hidden');
      stopFocusBtn.classList.remove('hidden');
      focusStatus.textContent = 'Active';
      focusStatus.classList.add('active');
    } else {
      startFocusBtn.classList.remove('hidden');
      stopFocusBtn.classList.add('hidden');
      focusStatus.textContent = 'Off';
      focusStatus.classList.remove('active');
    }
  }

  async function handleStartFocus() {
    setButtonsDisabled(true);
    showStatus('loading', 'Starting Focus Mode...', 'Initializing camera...');

    try {
      const tab = await getCurrentTab();

      // First ensure focus-tracker.js is injected
      await injectFocusTracker(tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'START_FOCUS_MODE'
      });

      if (response && response.success) {
        updateFocusUI(true);
        showStatus('success', 'Focus Mode Active!', 'Eye tracking enabled');
        setTimeout(() => hideStatus(), 3000);
      } else {
        showStatus('error', 'Failed to start', response?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('[Browser Wand Popup] Focus Mode error:', error);
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function handleStopFocus() {
    setButtonsDisabled(true);
    showStatus('loading', 'Stopping Focus Mode...', '');

    try {
      const tab = await getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'STOP_FOCUS_MODE' });

      if (response && response.success) {
        updateFocusUI(false);
        showStatus('success', 'Focus Mode Stopped', '');
        setTimeout(() => hideStatus(), 2000);
      } else {
        showStatus('error', 'Failed to stop', response?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('[Browser Wand Popup] Stop Focus error:', error);
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function injectFocusTracker(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/focus-tracker.js']
      });
      // Small delay to ensure script is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Script might already be injected, that's okay
      console.log('[Browser Wand Popup] Focus tracker injection:', error.message);
    }
  }

  function openSaveModal() {
    if (!lastModificationData || !lastPrompt) {
      showStatus('error', 'Nothing to save', 'Apply a modification first.');
      return;
    }

    if (lastModificationData.scriptCategory === SCRIPT_CATEGORIES.RUNTIME_LLM) {
      showStatus('error', 'Cannot save', 'This type of modification needs to run fresh each time and cannot be saved for reuse.');
      return;
    }

    const defaultName = lastPrompt.length > 50 ? lastPrompt.substring(0, 47) + '...' : lastPrompt;
    scriptNameInput.value = defaultName;
    saveScriptModal.classList.remove('hidden');
    scriptNameInput.focus();
    scriptNameInput.select();
  }

  function isSavableCategory(category) {
    return category === SCRIPT_CATEGORIES.STATIC_SCRIPT || category === SCRIPT_CATEGORIES.SAVABLE_RUNTIME;
  }

  function closeSaveModal() {
    saveScriptModal.classList.add('hidden');
    scriptNameInput.value = '';
  }

  async function handleSaveScript() {
    if (!lastModificationData || !lastPrompt) {
      showStatus('error', 'Nothing to save', 'Apply a modification first.');
      closeSaveModal();
      return;
    }

    const scriptName = scriptNameInput.value.trim();
    if (!scriptName) {
      scriptNameInput.focus();
      return;
    }

    const script = {
      id: Date.now().toString(),
      name: scriptName,
      prompt: lastPrompt,
      code: lastModificationData.code || '',
      css: lastModificationData.css || '',
      taskType: lastModificationData.taskType || 'GENERAL',
      scriptCategory: lastModificationData.scriptCategory || SCRIPT_CATEGORIES.STATIC_SCRIPT,
      createdAt: new Date().toISOString(),
    };

    // For SAVABLE_RUNTIME scripts (like translation), save additional metadata
    if (lastModificationData.scriptCategory === SCRIPT_CATEGORIES.SAVABLE_RUNTIME) {
      script.targetLanguage = lastModificationData.targetLanguage || null;
    }

    const scripts = await getSavedScripts();
    scripts.unshift(script);

    // Limit to 20 saved scripts
    if (scripts.length > 20) {
      scripts.pop();
    }

    await chrome.storage.local.set({ [SAVED_SCRIPTS_KEY]: scripts });
    closeSaveModal();
    loadSavedScripts();
    showStatus('success', 'Saved!', 'You can reapply it from "My Saved Modifications".');
    setTimeout(() => hideStatus(), 2000);
  }

  async function getSavedScripts() {
    const result = await chrome.storage.local.get([SAVED_SCRIPTS_KEY]);
    return result[SAVED_SCRIPTS_KEY] || [];
  }

  async function loadSavedScripts() {
    const scripts = await getSavedScripts();
    savedScriptsCount.textContent = scripts.length;

    if (scripts.length === 0) {
      savedScriptsList.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <line x1="9" y1="9" x2="10" y2="9"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
            <line x1="9" y1="17" x2="15" y2="17"></line>
          </svg>
          <span>No saved modifications yet</span>
        </div>
      `;
      return;
    }

    savedScriptsList.innerHTML = scripts.map(script => {
      const isRuntimeScript = script.scriptCategory === SCRIPT_CATEGORIES.SAVABLE_RUNTIME;
      const runtimeBadge = isRuntimeScript ? '<span class="runtime-badge" title="This script will process content fresh each time">AI</span>' : '';

      return `
      <div class="script-item" data-script-id="${script.id}">
        <div class="script-item-header">
          <div class="script-item-info">
            <div class="script-item-name">
              ${runtimeBadge}${escapeHtml(script.name)}
            </div>
            <div class="script-item-meta">
              ${formatDate(script.createdAt)}
            </div>
          </div>
          <div class="script-item-actions">
            <button class="btn-script-action btn-apply" data-action="apply" data-script-id="${script.id}">
              Apply
            </button>
            <button class="btn-script-action btn-delete" data-action="delete" data-script-id="${script.id}">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners to buttons
    savedScriptsList.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', () => handleApplySavedScript(btn.dataset.scriptId));
    });

    savedScriptsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteScript(btn.dataset.scriptId));
    });
  }

  async function handleApplySavedScript(scriptId) {
    const scripts = await getSavedScripts();
    const script = scripts.find(s => s.id === scriptId);

    if (!script) {
      showStatus('error', 'Not found', 'This modification may have been deleted.');
      return;
    }

    setButtonsDisabled(true);

    try {
      const tab = await getCurrentTab();

      // For SAVABLE_RUNTIME scripts (like translation), re-execute the LLM API
      if (script.scriptCategory === SCRIPT_CATEGORIES.SAVABLE_RUNTIME) {
        showStatus('loading', 'Processing...', 'Reading page content...');

        const pageContent = await getPageContent(tab.id);
        const modificationState = await getModificationState(tab.id);

        showStatus('loading', 'Processing...', 'Generating fresh content...');

        const sendMessageWithTimeout = (message, timeoutMs = 120000) => {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Request timed out. The AI service might be slow or unavailable.'));
            }, timeoutMs);

            chrome.runtime.sendMessage(message, (response) => {
              clearTimeout(timeout);
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
        };

        const response = await sendMessageWithTimeout({
          type: 'MODIFY_PAGE',
          payload: {
            apiKey: getApiKey(),
            prompt: script.prompt,
            pageContent,
            previousModifications: modificationState,
            model: getSelectedModel()
          }
        });

        if (!response) {
          throw new Error('No response from service worker. Please try reloading the extension.');
        }

        if (response.success) {
          showStatus('loading', 'Processing...', 'Applying changes...');

          const applyResult = await chrome.tabs.sendMessage(tab.id, {
            type: 'APPLY_MODIFICATIONS',
            payload: {
              code: response.data.code,
              css: response.data.css
            }
          });

          if (applyResult && applyResult.success) {
            showStatus('success', 'Applied!', script.name);
            showResult(`Applied: ${script.name}`, {
              scriptCategory: script.scriptCategory,
              taskType: script.taskType,
            });
          } else if (applyResult && applyResult.error) {
            showStatus('error', 'Failed to apply', applyResult.error);
          } else {
            showStatus('success', 'Applied!', script.name);
          }
        } else {
          showStatus('error', 'Processing failed', response.error);
        }
      } else {
        // For STATIC_SCRIPT, apply directly without LLM call
        showStatus('loading', 'Applying...', '');

        const applyResult = await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_MODIFICATIONS',
          payload: {
            code: script.code,
            css: script.css
          }
        });

        if (applyResult && applyResult.success) {
          showStatus('success', 'Applied!', script.name);
          showResult(`Applied: ${script.name}`, {
            scriptCategory: SCRIPT_CATEGORIES.STATIC_SCRIPT,
            taskType: script.taskType,
          });
        } else if (applyResult && applyResult.error) {
          showStatus('error', 'Failed to apply', applyResult.error);
        } else {
          showStatus('success', 'Applied!', script.name);
        }
      }
    } catch (error) {
      console.error('[Browser Wand Popup] Error applying saved script:', error);
      showStatus('error', 'Error', error.message);
    } finally {
      setButtonsDisabled(false);
    }
  }

  async function handleDeleteScript(scriptId) {
    const scripts = await getSavedScripts();
    const updatedScripts = scripts.filter(s => s.id !== scriptId);
    await chrome.storage.local.set({ [SAVED_SCRIPTS_KEY]: updatedScripts });
    loadSavedScripts();
    showStatus('success', 'Deleted', '');
    setTimeout(() => hideStatus(), 2000);
  }

  async function getPageContent(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTENT' });
      return response;
    } catch (error) {
      // Content script might not be injected yet, try to inject it
      if (error.message?.includes('Receiving end does not exist')) {
        await injectContentScript(tabId);
        const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTENT' });
        return response;
      }
      throw error;
    }
  }

  async function getModificationState(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_MODIFICATION_STATE' });
      return response;
    } catch (error) {
      if (error.message?.includes('Receiving end does not exist')) {
        await injectContentScript(tabId);
        const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_MODIFICATION_STATE' });
        return response;
      }
      throw error;
    }
  }

  async function injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js']
      });
      // Small delay to ensure script is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[Browser Wand Popup] Failed to inject content script:', error);
      throw new Error('Cannot access this page. Make sure you are on a regular webpage (not chrome://, edge://, or extension pages).');
    }
  }

  function setButtonsDisabled(disabled) {
    modifyBtn.disabled = disabled;
    resetBtn.disabled = disabled;
    saveScriptBtn.disabled = disabled;
    magicBarBtn.disabled = disabled;
    startFocusBtn.disabled = disabled;
    stopFocusBtn.disabled = disabled;
    // Disable all saved script buttons
    savedScriptsList.querySelectorAll('.btn-script-action').forEach(btn => {
      btn.disabled = disabled;
    });
  }

  function setModifyButtonLoading(isLoading, text = 'Modifying...') {
    if (isLoading) {
      modifyBtn.classList.add('loading');
      modifyBtnIconDefault.classList.add('hidden');
      modifyBtnIconLoading.classList.remove('hidden');
      modifyBtnText.textContent = text;
    } else {
      modifyBtn.classList.remove('loading');
      modifyBtnIconDefault.classList.remove('hidden');
      modifyBtnIconLoading.classList.add('hidden');
      modifyBtnText.textContent = 'Modify Page';
    }
  }

  function showStatusBar(type, text) {
    statusBar.classList.remove('hidden');
    appMain.classList.add('has-status-bar');
    statusBarText.textContent = text;

    statusBarIcon.classList.remove('success', 'error');

    if (type === 'loading') {
      statusBarIcon.innerHTML = `
        <svg class="spinner-svg" viewBox="0 0 24 24">
          <circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2"></circle>
          <circle class="spinner-fill" cx="12" cy="12" r="10" fill="none" stroke-width="2"></circle>
        </svg>
      `;
    } else if (type === 'success') {
      statusBarIcon.classList.add('success');
      statusBarIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;color:#10b981">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      statusBarIcon.classList.add('error');
      statusBarIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;color:#ef4444">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }
  }

  function hideStatusBar() {
    statusBar.classList.add('hidden');
    appMain.classList.remove('has-status-bar');
  }

  function showStatus(type, text, details) {
    if (type === 'loading') {
      setModifyButtonLoading(true, text);
      if (details) {
        showStatusBar('loading', details);
      }
    } else if (type === 'success') {
      setModifyButtonLoading(false);
      showStatusBar('success', text + (details ? ` - ${details}` : ''));
    } else if (type === 'error') {
      setModifyButtonLoading(false);
      showStatusBar('error', text + (details ? `: ${details}` : ''));
    }
  }

  function hideStatus() {
    setModifyButtonLoading(false);
    hideStatusBar();
  }

  function showResult(content, data = null) {
    resultSection.classList.remove('hidden');
    resultContent.textContent = content;

    // Show/hide save button based on script category
    if (data && isSavableCategory(data.scriptCategory)) {
      saveScriptBtn.classList.remove('hidden');
    } else {
      saveScriptBtn.classList.add('hidden');
    }
  }

  function hideResult() {
    resultSection.classList.add('hidden');
    resultContent.textContent = '';
    saveScriptBtn.classList.add('hidden');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
});
