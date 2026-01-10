/**
 * Focus Tracker Module
 * Provides eye tracking (WebGazer.js) for Focus Mode
 * Highlights text at the user's gaze position
 */

(() => {
  const FOCUS_TRACKER_ID = 'browser-wand-focus-tracker';
  const HIGHLIGHT_CLASS = 'bw-focus-highlight';
  const VIDEO_PREVIEW_ID = 'bw-camera-preview';
  const CALIBRATION_OVERLAY_ID = 'bw-calibration-overlay';

  const CONFIG = {
    highlightRadius: 100,
    fontSizeMultiplier: 1.5,
    transitionDuration: 200,
    gazeSmoothing: 5,
    calibrationPoints: 9,
    // Auto-scroll configuration
    scrollZonePercent: 0.2,       // Percentage of viewport height for scroll zones (20% = top/bottom 20%)
    scrollSpeed: 6,               // Base pixels per frame to scroll
    scrollAcceleration: 1.5,      // Multiplier for scroll speed closer to edge
    scrollInterval: 16,           // ~60fps scroll update interval
    scrollGazeDwellMs: 500,       // Time gaze must dwell in scroll zone before scrolling starts
    // Gaze timeout for resetting highlights
    gazeTimeoutMs: 300,           // Time without gaze update before resetting all highlights
  };

  let isActive = false;
  let gazeHistory = [];
  let currentHighlightedElements = new Set();
  let webgazerLoaded = false;
  let videoElement = null;
  let gazeTimeoutId = null;
  let scrollIntervalId = null;
  let currentScrollDirection = 0; // -1 for up, 0 for none, 1 for down
  let scrollZoneDwellStartTime = null; // Timestamp when gaze entered a scroll zone
  let pendingScrollDirection = 0; // Direction waiting for dwell threshold

  // External library URL
  const WEBGAZER_URL = 'https://webgazer.cs.brown.edu/webgazer.js';

  /**
   * Load external script via service worker to bypass CSP
   * The service worker fetches the script and injects it into the page's main world
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded by looking for global objects
      if (url.includes('webgazer') && window.webgazer) {
        resolve();
        return;
      }

      // Request the service worker to load the script
      chrome.runtime.sendMessage(
        { type: 'LOAD_EXTERNAL_SCRIPT', payload: { url } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            // Small delay to ensure script is fully initialized
            setTimeout(resolve, 100);
          } else {
            reject(new Error(response?.error || `Failed to load script: ${url}`));
          }
        }
      );
    });
  }

  /**
   * Execute code in the page's MAIN world via service worker
   */
  function executeInMainWorld(code) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'EXECUTE_CODE', payload: { code } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Code execution failed'));
          }
        }
      );
    });
  }

  /**
   * Initialize WebGazer for eye tracking
   * Runs in the page's MAIN world to access the loaded library
   */
  async function initWebGazer() {
    if (webgazerLoaded) return true;

    try {
      await loadScript(WEBGAZER_URL);

      // Initialize WebGazer in the MAIN world where the library was loaded
      // Use custom events to communicate gaze data back to content script
      const initCode = `
        (function() {
          if (!window.webgazer) {
            console.error('[Browser Wand Focus] WebGazer not found in window');
            return false;
          }

          window.webgazer
            .setRegression('ridge')
            .setTracker('TFFacemesh')
            .setGazeListener((data, timestamp) => {
              if (data == null) return;
              // Dispatch custom event with gaze data for content script to receive
              window.dispatchEvent(new CustomEvent('bw-gaze-update', {
                detail: { x: data.x, y: data.y }
              }));
            });

          // Configure WebGazer appearance
          window.webgazer.showVideoPreview(false);
          window.webgazer.showPredictionPoints(false);
          window.webgazer.showFaceOverlay(false);
          window.webgazer.showFaceFeedbackBox(false);

          console.log('[Browser Wand Focus] WebGazer initialized in MAIN world');
          return true;
        })();
      `;

      await executeInMainWorld(initCode);
      webgazerLoaded = true;

      // Listen for gaze updates from MAIN world
      window.addEventListener('bw-gaze-update', (event) => {
        if (event.detail) {
          handleGazeUpdate(event.detail.x, event.detail.y);
        }
      });

      return true;
    } catch (error) {
      console.error('[Browser Wand Focus] Failed to initialize WebGazer:', error);
      return false;
    }
  }

  /**
   * Start camera stream
   */
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      videoElement = document.createElement('video');
      videoElement.id = VIDEO_PREVIEW_ID;
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;

      // Style for small preview in corner
      Object.assign(videoElement.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '160px',
        height: '120px',
        borderRadius: '8px',
        border: '2px solid rgba(102, 126, 234, 0.6)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: '999998',
        transform: 'scaleX(-1)',
        objectFit: 'cover'
      });

      document.body.appendChild(videoElement);

      await new Promise(resolve => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      return true;
    } catch (error) {
      console.error('[Browser Wand Focus] Failed to start camera:', error);
      return false;
    }
  }

  /**
   * Stop camera stream
   */
  function stopCamera() {
    if (videoElement) {
      const stream = videoElement.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      videoElement.remove();
      videoElement = null;
    }
  }

  /**
   * Handle gaze position update from eye tracking
   */
  function handleGazeUpdate(x, y) {
    if (!isActive) return;

    // Clear previous gaze timeout and set a new one
    // This ensures highlights are reset if no gaze update is received
    clearGazeTimeout();
    gazeTimeoutId = setTimeout(() => {
      resetAllHighlights();
      stopAutoScroll();
    }, CONFIG.gazeTimeoutMs);

    // Smooth the gaze position
    gazeHistory.push({ x, y });
    if (gazeHistory.length > CONFIG.gazeSmoothing) {
      gazeHistory.shift();
    }

    const smoothedX = gazeHistory.reduce((sum, p) => sum + p.x, 0) / gazeHistory.length;
    const smoothedY = gazeHistory.reduce((sum, p) => sum + p.y, 0) / gazeHistory.length;

    highlightTextAtPosition(smoothedX, smoothedY);
    handleAutoScroll(smoothedY);
  }

  /**
   * Clear the gaze timeout
   */
  function clearGazeTimeout() {
    if (gazeTimeoutId) {
      clearTimeout(gazeTimeoutId);
      gazeTimeoutId = null;
    }
  }

  /**
   * Reset all highlighted elements to their original styles
   */
  function resetAllHighlights() {
    currentHighlightedElements.forEach(element => {
      removeHighlight(element);
    });
    currentHighlightedElements.clear();
  }

  /**
   * Handle auto-scrolling when gaze is at top or bottom 20% of viewport
   * ONLY scrolls up when looking at top 20%, ONLY scrolls down when looking at bottom 20%
   * Requires gaze to dwell in scroll zone for a minimum time before scrolling starts
   */
  function handleAutoScroll(gazeY) {
    const viewportHeight = window.innerHeight;
    const scrollZoneHeight = viewportHeight * CONFIG.scrollZonePercent;
    const topZoneThreshold = scrollZoneHeight; // Top 20% boundary
    const bottomZoneThreshold = viewportHeight - scrollZoneHeight; // Bottom 80% = start of bottom 20%

    let detectedDirection = 0;
    let scrollIntensity = 1;

    // STRICTLY check if gaze is in top 20% for scroll up
    if (gazeY >= 0 && gazeY < topZoneThreshold) {
      detectedDirection = -1; // Scroll up
      // Calculate intensity based on how close to top edge (closer = faster)
      scrollIntensity = 1 + (CONFIG.scrollAcceleration - 1) * (1 - gazeY / topZoneThreshold);
    }
    // STRICTLY check if gaze is in bottom 20% for scroll down
    else if (gazeY > bottomZoneThreshold && gazeY <= viewportHeight) {
      detectedDirection = 1; // Scroll down
      // Calculate intensity based on how close to bottom edge (closer = faster)
      scrollIntensity = 1 + (CONFIG.scrollAcceleration - 1) * ((gazeY - bottomZoneThreshold) / scrollZoneHeight);
    }
    // Gaze is in middle 60% - no scrolling
    else {
      detectedDirection = 0;
    }

    const now = Date.now();

    // If detected direction changed, reset dwell timer
    if (detectedDirection !== pendingScrollDirection) {
      pendingScrollDirection = detectedDirection;
      scrollZoneDwellStartTime = detectedDirection !== 0 ? now : null;

      // If we moved out of scroll zone, stop scrolling immediately
      if (detectedDirection === 0) {
        stopAutoScroll();
        return;
      }
    }

    // If in a scroll zone, check if dwell time threshold is met
    if (detectedDirection !== 0 && scrollZoneDwellStartTime !== null) {
      const dwellTime = now - scrollZoneDwellStartTime;

      if (dwellTime >= CONFIG.scrollGazeDwellMs) {
        // Dwell threshold met, start or update scrolling
        if (detectedDirection !== currentScrollDirection) {
          currentScrollDirection = detectedDirection;
          startAutoScroll(detectedDirection, scrollIntensity);
        } else {
          // Update scroll intensity while maintaining direction
          updateScrollSpeed(scrollIntensity);
        }
      }
      // If dwell threshold not met, don't scroll yet (waiting for gaze to stabilize)
    }
  }

  /**
   * Start auto-scrolling in the specified direction
   */
  let currentScrollIntensity = 1;

  function startAutoScroll(direction, intensity) {
    stopAutoScroll();
    currentScrollIntensity = intensity;

    scrollIntervalId = setInterval(() => {
      const scrollAmount = CONFIG.scrollSpeed * direction * currentScrollIntensity;
      window.scrollBy({
        top: scrollAmount,
        behavior: 'auto'
      });
    }, CONFIG.scrollInterval);
  }

  /**
   * Update the scroll speed without restarting the interval
   */
  function updateScrollSpeed(intensity) {
    currentScrollIntensity = intensity;
  }

  /**
   * Stop auto-scrolling
   */
  function stopAutoScroll() {
    if (scrollIntervalId) {
      clearInterval(scrollIntervalId);
      scrollIntervalId = null;
    }
    currentScrollDirection = 0;
    pendingScrollDirection = 0;
    scrollZoneDwellStartTime = null;
  }

  /**
   * Find text elements at a given position
   * Only returns elements where the gaze point is actually inside the element's bounding box
   */
  function findTextElementsAtPosition(x, y, radius) {
    const insideElements = [];
    const nearbyElements = [];

    // Get all text-containing elements
    const textSelectors = 'p, span, h1, h2, h3, h4, h5, h6, li, td, th, a, label, div, article';
    const allElements = document.querySelectorAll(textSelectors);

    allElements.forEach(element => {
      // Skip hidden elements
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return;
      }

      // Skip elements that don't contain meaningful text
      const text = element.textContent?.trim();
      if (!text || text.length < 3) return;

      // Check if element is just a container with no direct text
      const hasDirectText = Array.from(element.childNodes).some(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
      );
      if (!hasDirectText && element.children.length > 0) return;

      const rect = element.getBoundingClientRect();

      // Check if point is inside the element's bounding box
      const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (isInside) {
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(x - elementCenterX, 2) +
          Math.pow(y - elementCenterY, 2)
        );
        insideElements.push({ element, distance });
      } else {
        // Calculate distance from gaze point to nearest edge of element
        const nearestX = Math.max(rect.left, Math.min(x, rect.right));
        const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));
        const edgeDistance = Math.sqrt(
          Math.pow(x - nearestX, 2) +
          Math.pow(y - nearestY, 2)
        );

        // Only consider nearby elements within a small radius (30px) for edge cases
        if (edgeDistance < 30) {
          nearbyElements.push({ element, distance: edgeDistance });
        }
      }
    });

    // Sort inside elements by distance to center (closest first)
    insideElements.sort((a, b) => a.distance - b.distance);

    // If gaze is inside text elements, return those (prioritize direct hits)
    if (insideElements.length > 0) {
      return insideElements.slice(0, 3).map(e => e.element);
    }

    // If no direct hits but very close to text, return the nearest one
    if (nearbyElements.length > 0) {
      nearbyElements.sort((a, b) => a.distance - b.distance);
      return [nearbyElements[0].element];
    }

    // No text elements at gaze position
    return [];
  }

  /**
   * Highlight text elements at the gaze position
   */
  function highlightTextAtPosition(x, y) {
    const elementsToHighlight = findTextElementsAtPosition(x, y, CONFIG.highlightRadius);

    // If no elements found at gaze position, reset all highlights
    if (elementsToHighlight.length === 0) {
      resetAllHighlights();
      return;
    }

    // Remove highlight from elements no longer in focus
    currentHighlightedElements.forEach(element => {
      if (!elementsToHighlight.includes(element)) {
        removeHighlight(element);
        currentHighlightedElements.delete(element);
      }
    });

    // Add highlight to new elements
    elementsToHighlight.forEach(element => {
      if (!currentHighlightedElements.has(element)) {
        applyHighlight(element);
        currentHighlightedElements.add(element);
      }
    });
  }

  /**
   * Apply highlight styles to an element
   */
  function applyHighlight(element) {
    // Store original styles
    if (!element.dataset.bwOriginalStyles) {
      element.dataset.bwOriginalStyles = JSON.stringify({
        fontSize: element.style.fontSize,
        color: element.style.color,
        backgroundColor: element.style.backgroundColor,
        transform: element.style.transform,
        transition: element.style.transition,
        textShadow: element.style.textShadow,
        zIndex: element.style.zIndex,
        position: element.style.position
      });
    }

    const computedStyle = window.getComputedStyle(element);
    const currentFontSize = parseFloat(computedStyle.fontSize);
    const newFontSize = currentFontSize * CONFIG.fontSizeMultiplier;

    element.classList.add(HIGHLIGHT_CLASS);

    Object.assign(element.style, {
      fontSize: `${newFontSize}px`,
      color: '#1a1a2e',
      backgroundColor: 'rgba(255, 235, 59, 0.4)',
      transform: 'scale(1.02)',
      transition: `all ${CONFIG.transitionDuration}ms ease-out`,
      textShadow: '0 0 8px rgba(255, 235, 59, 0.6)',
      zIndex: '999990',
      position: 'relative'
    });
  }

  /**
   * Remove highlight from an element
   * Immediately restores original styles to prevent race conditions
   */
  function removeHighlight(element) {
    element.classList.remove(HIGHLIGHT_CLASS);

    if (element.dataset.bwOriginalStyles) {
      const original = JSON.parse(element.dataset.bwOriginalStyles);

      // Immediately delete the data attribute to prevent race conditions
      delete element.dataset.bwOriginalStyles;

      // Apply transition and restore original values immediately
      element.style.transition = `all ${CONFIG.transitionDuration}ms ease-out`;

      Object.assign(element.style, {
        fontSize: original.fontSize || '',
        color: original.color || '',
        backgroundColor: original.backgroundColor || '',
        transform: original.transform || '',
        textShadow: original.textShadow || '',
        zIndex: original.zIndex || '',
        position: original.position || ''
      });

      // Restore original transition after animation completes
      setTimeout(() => {
        element.style.transition = original.transition || '';
      }, CONFIG.transitionDuration);
    }
  }

  /**
   * Show calibration overlay for eye tracking
   */
  function showCalibrationOverlay() {
    const overlay = document.createElement('div');
    overlay.id = CALIBRATION_OVERLAY_ID;

    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(26, 26, 46, 0.95)',
      zIndex: '999999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e8e8e8'
    });

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <h2 style="font-size: 24px; margin-bottom: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Eye Tracking Calibration
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #aaa; margin-bottom: 30px;">
          To improve accuracy, please click on different parts of the screen while looking at your cursor.
          The more you interact, the better the tracking becomes.
        </p>
        <p style="font-size: 13px; color: #888; margin-bottom: 20px;">
          Click anywhere to start using Focus Mode. The calibration will improve as you use the page.
        </p>
        <button id="bw-start-focus" style="
          padding: 12px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          Start Focus Mode
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const startBtn = overlay.querySelector('#bw-start-focus');
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'translateY(-2px)';
      startBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = '';
      startBtn.style.boxShadow = '';
    });

    startBtn.addEventListener('click', () => {
      overlay.remove();
    });

    // Also close on any click after a delay
    setTimeout(() => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
    }, 1000);
  }

  /**
   * Create focus mode indicator
   */
  function createFocusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = FOCUS_TRACKER_ID;

    Object.assign(indicator.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
      cursor: 'pointer'
    });

    indicator.innerHTML = `
      <span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; animation: bw-pulse 2s infinite;"></span>
      <span>Focus Mode: Eye Tracking</span>
      <span style="margin-left: 4px; opacity: 0.7;">✕</span>
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bw-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    indicator.addEventListener('click', () => {
      stopFocusMode();
    });

    document.body.appendChild(indicator);
  }

  /**
   * Start Focus Mode
   */
  async function startFocusMode() {
    if (isActive) {
      console.log('[Browser Wand Focus] Focus Mode already active');
      return { success: false, error: 'Focus Mode is already active' };
    }

    console.log('[Browser Wand Focus] Starting Focus Mode with eye tracking');

    // Start camera first
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      return { success: false, error: 'Failed to access camera. Please grant camera permission.' };
    }

    const webgazerReady = await initWebGazer();
    if (!webgazerReady) {
      stopCamera();
      return { success: false, error: 'Failed to initialize eye tracking.' };
    }

    // Start WebGazer in MAIN world
    await executeInMainWorld('window.webgazer.begin();');
    showCalibrationOverlay();

    isActive = true;
    createFocusIndicator();

    return { success: true };
  }

  /**
   * Stop Focus Mode
   */
  async function stopFocusMode() {
    if (!isActive) return { success: true };

    console.log('[Browser Wand Focus] Stopping Focus Mode');

    isActive = false;

    // Stop WebGazer in MAIN world
    try {
      await executeInMainWorld('if (window.webgazer) { window.webgazer.end(); }');
    } catch (e) {
      console.log('[Browser Wand Focus] WebGazer cleanup error (non-fatal):', e);
    }

    // Stop camera
    stopCamera();

    // Stop auto-scroll and clear gaze timeout
    stopAutoScroll();
    clearGazeTimeout();

    // Remove highlights
    currentHighlightedElements.forEach(element => {
      removeHighlight(element);
    });
    currentHighlightedElements.clear();
    gazeHistory = [];

    // Remove indicator
    const indicator = document.getElementById(FOCUS_TRACKER_ID);
    if (indicator) indicator.remove();

    // Remove calibration overlay if present
    const calibration = document.getElementById(CALIBRATION_OVERLAY_ID);
    if (calibration) calibration.remove();

    return { success: true };
  }

  /**
   * Get Focus Mode status
   */
  function getFocusModeStatus() {
    return {
      isActive,
      highlightedCount: currentHighlightedElements.size
    };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_FOCUS_MODE') {
      (async () => {
        const result = await startFocusMode();
        sendResponse(result);
      })();
      return true;
    }

    if (message.type === 'STOP_FOCUS_MODE') {
      (async () => {
        const result = await stopFocusMode();
        sendResponse(result);
      })();
      return true;
    }

    if (message.type === 'GET_FOCUS_STATUS') {
      sendResponse(getFocusModeStatus());
      return true;
    }
  });

  // Expose for debugging
  window.__browserWandFocus = {
    start: startFocusMode,
    stop: stopFocusMode,
    status: getFocusModeStatus
  };

  console.log('[Browser Wand Focus] Focus Tracker module loaded');
})();
