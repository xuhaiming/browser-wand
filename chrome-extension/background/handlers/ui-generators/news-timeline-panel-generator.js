/**
 * News Timeline panel generator
 * Generates JavaScript code to display news timeline results in a sidebar panel
 */

import { getNewsTimelinePanelStyles } from './panel-styles.js';
import { getMarkdownParserCode } from './markdown-parser.js';

/**
 * Generates JavaScript code to display news timeline results in a sidebar panel
 * @param {Object} searchResult - Search result object from newsTimelineSearch
 * @param {string} searchQuery - The original search query
 * @returns {string} - JavaScript code string
 */
export function generateNewsTimelineDisplayCode(searchResult, searchQuery) {
  const topic = searchResult.topic || '';
  const backgroundSummary = searchResult.backgroundSummary || '';
  const currentStatus = searchResult.currentStatus || '';
  const timeline = searchResult.timeline || [];
  const sources = searchResult.sources || [];

  const styles = getNewsTimelinePanelStyles();
  const markdownParserCode = getMarkdownParserCode();

  return `
(function() {
  ${markdownParserCode}

  const TOPIC = ${JSON.stringify(topic)};
  const BACKGROUND_SUMMARY = ${JSON.stringify(backgroundSummary)};
  const CURRENT_STATUS = ${JSON.stringify(currentStatus)};
  const TIMELINE = ${JSON.stringify(timeline)};
  const SOURCES = ${JSON.stringify(sources)};
  const SEARCH_QUERY = ${JSON.stringify(searchQuery)};

  // Remove existing panel if present
  const existingPanel = document.getElementById('bw-magic-bar-panel');
  if (existingPanel) existingPanel.remove();
  const existingToggle = document.getElementById('bw-magic-toggle');
  if (existingToggle) existingToggle.remove();

  // Parse markdown
  const parsedBackground = parseMarkdown(BACKGROUND_SUMMARY);
  const parsedStatus = parseMarkdown(CURRENT_STATUS);

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'bw-magic-bar-panel';
  panel.innerHTML = \`
    <style>${styles}</style>
    <div class="mb-header">
      <div class="mb-header-top">
        <div class="mb-logo">
          <div class="mb-logo-icon">📰</div>
          <div>
            <h3 class="mb-title">News Timeline</h3>
            <div class="mb-subtitle">Background & Events</div>
          </div>
        </div>
        <button class="mb-close" id="mb-close">×</button>
      </div>
      <div class="mb-query">
        <div class="mb-query-label">Researching</div>
        <div class="mb-query-text">\${SEARCH_QUERY}</div>
      </div>
      \${TIMELINE.length > 0 ? \`
        <div class="mb-stats">
          <span class="mb-stat">\${TIMELINE.length} events found</span>
          <span class="mb-stat highlight">\${SOURCES.length} sources</span>
        </div>
      \` : ''}
    </div>
    <div class="mb-content">
      \${TOPIC ? \`<div class="mb-topic">\${TOPIC}</div>\` : ''}

      \${CURRENT_STATUS ? \`
        <div class="mb-current-status">
          <div class="mb-current-status-label">Current Status</div>
          <div class="mb-current-status-text">\${parsedStatus}</div>
        </div>
      \` : ''}

      \${BACKGROUND_SUMMARY ? \`
        <div class="mb-background">
          <div class="mb-background-title">Background</div>
          <div class="mb-background-text">\${parsedBackground}</div>
        </div>
      \` : ''}

      \${TIMELINE.length > 0 ? \`
        <div class="mb-timeline-section">
          <div class="mb-timeline-title">Timeline (\${TIMELINE.length} events)</div>
          <div class="mb-timeline">
            \${TIMELINE.map(event => {
              const importance = (event.importance || 'medium').toLowerCase();
              const hasUrl = event.url && event.url.startsWith('http');
              return \`
                <div class="mb-timeline-event \${importance}" \${hasUrl ? \`onclick="window.open('\${event.url}', '_blank')"\` : ''}>
                  <div class="mb-event-header">
                    <span class="mb-event-date">\${event.date || 'Unknown date'}</span>
                    \${event.importance ? \`<span class="mb-event-importance \${importance}">\${importance}</span>\` : ''}
                  </div>
                  <div class="mb-event-title">\${event.title || ''}</div>
                  \${event.description ? \`<div class="mb-event-description">\${event.description}</div>\` : ''}
                  <div class="mb-event-footer">
                    \${event.source ? \`<span class="mb-event-source">\${event.source}</span>\` : '<span></span>'}
                    \${hasUrl ? \`<a href="\${event.url}" target="_blank" class="mb-event-link" onclick="event.stopPropagation()">Read more</a>\` : ''}
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </div>
      \` : ''}

      \${SOURCES.length > 0 ? \`
        <div class="mb-sources-title">Sources (\${SOURCES.length})</div>
        \${SOURCES.map(s => \`
          <div class="mb-source-card" \${s.url ? \`onclick="window.open('\${s.url}', '_blank')"\` : ''}>
            <div class="mb-source-title">\${s.title}</div>
            \${s.url ? \`<div class="mb-source-url">\${s.url}</div>\` : ''}
          </div>
        \`).join('')}
      \` : ''}

      \${!BACKGROUND_SUMMARY && TIMELINE.length === 0 ? \`
        <div class="mb-no-results">
          <div class="mb-no-results-icon">🔍</div>
          <div class="mb-no-results-text">No timeline events found</div>
        </div>
      \` : ''}
    </div>
    <div class="mb-footer">
      <div class="mb-footer-text">Powered by <span>News Timeline</span> with Google Search</div>
    </div>
  \`;

  document.body.appendChild(panel);

  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'mb-toggle';
  toggle.id = 'mb-magic-toggle';
  toggle.innerHTML = '◀';
  document.body.appendChild(toggle);

  // Event handlers
  document.getElementById('mb-close').onclick = function() {
    panel.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
    toggle.innerHTML = panel.classList.contains('collapsed') ? '▶' : '◀';
  };

  toggle.onclick = function() {
    panel.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
    toggle.innerHTML = panel.classList.contains('collapsed') ? '▶' : '◀';
  };

  console.log('[Browser Wand] News Timeline panel rendered:', TIMELINE.length + ' events');
})();`;
}
