# Browser Wand

A Chrome extension that leverages AI to intelligently read, analyze, and modify web page content using natural language prompts. Simply describe what you want to change, and Browser Wand generates and applies the necessary JavaScript and CSS code automatically.

## Features

### Core Capabilities

- **Page Modification**: Describe changes in natural language, and the AI generates JavaScript/CSS code to apply them
- **Page Analysis**: Ask questions about the current page content and get intelligent responses
- **Content Summarization**: Get AI-generated summaries of articles and web pages
- **Translation**: Add side-by-side translations to web page content
- **Reader Mode**: Extract and display only the main article content, hiding distractions
- **Thematic Reskinning**: Transform the entire page's visual style to match a specific mood, era, or aesthetic (cyberpunk, vintage newspaper, children's book, etc.)
- **Magic Bar (AI-Powered Web Search + Image Generation)**: Universal search feature that uses Gemini API with Google Search grounding to find any information - products, prices, facts, research, and more. Also supports AI image generation using Nano Banana Pro model
- **Focus Mode (Eye Tracking)**: Use your webcam to track where you're looking, and automatically highlight and enlarge text at that location for easier reading
- **Saved Scripts**: Save and reuse modification scripts across different pages
- **Reset Changes**: Restore pages to their original state with one click

### Supported Task Types

The extension automatically detects the type of task based on your prompt:

| Task Type | Category | Description | Example Prompts |
|-----------|----------|-------------|-----------------|
| **Content Extraction** | Static | Isolates main article content | "Show only the main article", "Reader mode", "Focus on the content" |
| **Ad Removal** | Static | Hides advertisements and promotional content | "Remove all ads", "Hide sponsored content", "Block banners" |
| **Comment Removal** | Static | Hides comment sections and discussions | "Hide comments", "Remove discussion section" |
| **Styling** | Static | Changes visual appearance | "Enable dark mode", "Make text larger", "Change background to blue" |
| **Thematic Reskinning** | Static | Transforms entire page to match a mood/era | "Make this look like a cyberpunk terminal", "Vintage newspaper style" |
| **Element Hiding** | Static | Hides specific elements | "Hide the header", "Remove the sidebar", "Hide navigation" |
| **Translation** | Savable Runtime | Adds side-by-side translations | "Translate to Chinese", "Add Spanish translation" |
| **Summarization** | Runtime | Generates content summaries | "Summarize this article", "What are the main points?" |
| **Analysis** | Runtime | Answers questions about the page | "How many images are on this page?", "List all headings" |
| **Magic Bar** | Runtime | AI-powered web search for any information and image generation | "Best laptops under $1000", "Find similar products", "What is quantum computing?", "Generate an image of a sunset over mountains" |
| **Focus Mode** | Runtime | Tracks eye gaze to highlight text | Click "Focus Mode" button in the extension |
| **General** | Static | Any other modification request | "Add a red border to all images", "Highlight all links" |

**Script Categories:**
- **Static Scripts**: Can be saved and re-applied to other pages (content extraction, ad removal, styling, etc.)
- **Savable Runtime Scripts**: Can be saved, but will execute fresh LLM API calls when applied (translation - saves the intent, processes content fresh each time)
- **Runtime Scripts**: Require fresh LLM API calls each time and cannot be saved (summarization, analysis)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked**
5. Select the `chrome-extension` folder from this project
6. The Browser Wand icon will appear in your Chrome toolbar

## Usage

### Basic Usage

1. Navigate to any web page you want to modify
2. Click the Browser Wand extension icon in the Chrome toolbar
3. Enter your prompt describing what you want to do
4. Click **Modify Page**
5. To undo changes, click **Reset Changes**

### Saving Scripts

For static modification tasks (styling, hiding elements, ad removal, etc.):
1. After applying a modification, click **Save Script**
2. Give your script a descriptive name
3. Access saved scripts from the **Saved Scripts** section
4. Apply saved scripts to any page with one click

### Example Prompts

**Analysis**:
- "What are the main headings on this page?"
- "How many buttons are on this page?"
- "List all external links"

**Content Extraction**:
- "Show only the main article"
- "Enable reader mode"
- "Extract the main content and hide everything else"

**Styling**:
- "Enable dark mode"
- "Make all text 20% larger"
- "Change the background color to light gray"
- "Use a serif font for the article"

**Thematic Reskinning**:
- "Make this boring documentation look like a 1990s cyberpunk hacker terminal"
- "Make this news site look like a cozy vintage newspaper"
- "Turn this Wikipedia page into a children's book style"
- "Give this page a synthwave/vaporwave aesthetic"
- "Transform this into an 80s retro style"
- "Make this look like a medieval manuscript"
- "Apply a minimalist brutalist design"

**Element Modification**:
- "Hide the navigation bar"
- "Remove all images"
- "Add a red border to all buttons"
- "Make the header sticky"

**Ad/Comment Removal**:
- "Hide all advertisements"
- "Remove sponsored content"
- "Hide the comment section"

**Translation**:
- "Translate the page to Spanish"
- "Add Chinese translation beside the text"
- "Show bilingual view with Japanese"

**Summarization**:
- "Summarize this article"
- "What is this page about?"
- "Give me the key points"

**Magic Bar** (universal AI-powered search + image generation):
Use the Magic Bar input field in the extension popup to search for anything or generate images:

*Product Searches:*
- "Find similar products to this"
- "Best wireless headphones under $200"
- "Compare prices for iPhone 15"
- "Find alternatives to this product on Amazon"

*Information Searches:*
- "What is the latest news about AI?"
- "How does machine learning work?"
- "Best restaurants in San Francisco"
- "Reviews for this product"
- "Tips for learning Python"
- "How to start a small business"

*Image Generation (Nano Banana Pro):*
- "Generate an image of a sunset over mountains"
- "Create a picture of a futuristic city"
- "Draw an illustration of a cat wearing a hat"
- "Make 3 images of different coffee cup designs"
- "Generate a landscape image of a forest in autumn"

The Magic Bar automatically detects whether you're searching for products, information, or requesting images and displays results in a beautiful sidebar panel with verified links from Google Search or generated images with download options.

**Focus Mode** (use the dedicated button):
- Click the "Start Eye Tracking" button in the extension popup
- Grant camera permission when prompted
- Text where you look will be automatically highlighted and enlarged

## API Configuration

The extension uses Gemini API for AI processing.

### Custom API Key Setup

1. Click the **Settings** toggle in the extension popup
2. Enter your Gemini API key
3. Click **Save Settings**

The API key is stored locally in Chrome storage and is never transmitted except to the configured API endpoint.

### Model Selection

Browser Wand supports switching between different Gemini models:

| Model | Description | Best For |
|-------|-------------|----------|
| **Gemini 3 Pro** | Best quality, slower | Complex modifications, detailed analysis |
| **Gemini 3 Flash** | Fast and efficient | Quick tasks, simple modifications |

To change the model:
1. Click the **Settings** toggle in the extension popup
2. Select your preferred model from the options
3. Click **Save Settings**

Your model preference is saved and will be used for all subsequent requests.

## Architecture

### Project Structure

```
chrome-extension/
├── manifest.json                           # Extension configuration (Manifest V3)
├── README.md                               # This file
├── popup/
│   ├── popup.html                          # Extension popup UI
│   ├── popup.css                           # Popup styles (dark gradient theme)
│   └── popup.js                            # Popup logic, saved scripts, message handling
├── background/
│   ├── service-worker.js                   # Main service worker entry point
│   ├── config.js                           # API, limits, task types, script categories
│   ├── llm-client.js                       # LLM API communication and response parsing
│   ├── task-detector.js                    # Task type detection from prompts
│   ├── handlers/
│   │   └── modify-page.js                  # Page modification orchestration
│   ├── prompts/
│   │   ├── index.js                        # Main prompts module entry point
│   │   ├── base-rules.js                   # Base LLM rules and JSON format
│   │   ├── prompt-builder.js               # Prompt construction utilities
│   │   ├── selectors.js                    # CSS selector configurations by category
│   │   ├── css-templates.js                # CSS generation utilities and templates
│   │   ├── js-templates.js                 # JavaScript code templates
│   │   ├── task-prompts.js                 # Legacy compatibility layer
│   │   └── prompts/                        # Task-specific prompt templates
│   │       ├── index.js                    # Re-exports all task prompts
│   │       ├── content-extraction.js       # Reader mode prompt
│   │       ├── ad-removal.js               # Ad removal prompt
│   │       ├── comment-removal.js          # Comment hiding prompt
│   │       ├── element-hiding.js           # Element hiding prompt
│   │       ├── styling.js                  # Visual styling prompt
│   │       ├── thematic-reskinning.js      # Thematic reskinning prompt
│   │       ├── translation.js              # Translation prompt
│   │       ├── general.js                  # General modification prompt
│   │       ├── summarize.js                # Summarization prompt
│   │       └── analyze.js                  # Page analysis prompt
│   └── utils/
│       └── html-to-markdown.js             # HTML to Markdown converter
├── content/
│   ├── content.js                          # DOM reading, modification, state tracking
│   ├── content.css                         # Injected styles for UI elements
│   └── focus-tracker.js                    # Eye tracking for Focus Mode
├── libs/
│   └── (External libraries loaded via CDN) # WebGazer.js
└── icons/
    ├── icon16.png                          # 16x16 toolbar icon
    ├── icon48.png                          # 48x48 extension icon
    ├── icon128.png                         # 128x128 Chrome Web Store icon
    └── *.svg                               # SVG source files
```

### Component Overview

#### Popup (`popup/`)
The user interface for the extension. Handles:
- User input collection
- Settings management (API key storage)
- Communication with service worker and content script
- Status and result display
- Saved scripts management (save, load, apply, delete)

#### Service Worker (`background/`)
The main processing hub running in Chrome's background context:

- **service-worker.js**: Message routing and code execution via `chrome.scripting.executeScript`
- **config.js**: Configuration constants for API, content limits, task types, script categories, and chunking
- **llm-client.js**: Handles API calls, response parsing, translation chunking, and summarization
- **task-detector.js**: Analyzes prompts using regex patterns and keywords to classify into 9 task types
- **handlers/modify-page.js**: Orchestrates page modification based on detected task type

##### Prompts Module (`background/prompts/`)
Modular prompt system organized by function:

- **selectors.js**: CSS selector configurations organized by category (content selectors, non-content elements, ads, comments, etc.)
- **css-templates.js**: CSS generation functions for reader mode, ad removal, comment hiding, and other styling tasks
- **js-templates.js**: JavaScript templates for content extraction, selective hiding, ad removal with MutationObserver, and translations
- **prompts/**: Individual prompt templates for each task type with specialized LLM instructions

#### Content Script (`content/`)
Runs in the context of web pages:
- Extracts page content (HTML, text, elements summary, text blocks)
- Applies CSS modifications
- Coordinates JavaScript execution with service worker
- Tracks modification state for reset functionality
- Detects suspected ads and comments
- Identifies main content candidates

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           User Interaction                               │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Popup (popup.js)                                 │
│  1. Collect user prompt                                                  │
│  2. Request page content from content script                             │
│  3. Send modification request to service worker                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌────────────────────────────┐    ┌────────────────────────────────────────┐
│   Content Script           │    │         Service Worker                 │
│   (content.js)             │    │         (service-worker.js)            │
│                            │    │                                        │
│   - Extract page HTML      │    │   1. Detect task type                  │
│   - Get visible text       │    │   2. Build appropriate prompt          │
│   - Identify elements      │    │   3. Call LLM API                      │
│   - Detect ads/comments    │    │   4. Parse response (JS/CSS)           │
│   - Track modifications    │    │   5. Determine script category         │
└────────────────────────────┘    └────────────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Apply Modifications                                 │
│  - CSS injected via content script                                       │
│  - JS executed via chrome.scripting.executeScript (bypasses CSP)         │
│  - Static scripts can be saved for reuse                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Message Types

| Message | Direction | Purpose |
|---------|-----------|---------|
| `GET_PAGE_CONTENT` | Popup → Content | Request page DOM and metadata |
| `GET_MODIFICATION_STATE` | Popup → Content | Get current modification state |
| `MODIFY_PAGE` | Popup → Service Worker | Request AI-generated modifications |
| `EXECUTE_CODE` | Content → Service Worker | Execute JS in page's main world |
| `APPLY_MODIFICATIONS` | Popup → Content | Apply CSS and coordinate JS execution |
| `RESET_MODIFICATIONS` | Popup → Content | Restore original page state |

## Technical Details

### Content Extraction Strategy

The extension uses a multi-tier approach to find main content:

1. **Schema.org/Data Attributes**: `[itemprop="articleBody"]`, `[data-testid*="article"]`
2. **Semantic Classes**: `.article-body`, `.post-content`, `.entry-content`
3. **ID-based Selectors**: `#article-body`, `#main-content`
4. **Semantic HTML Elements**: `<article>`, `<main>`, `[role="main"]`
5. **Text Density Fallback**: Finds element with highest text-to-DOM ratio

### Ad Detection

Comprehensive ad detection with false positive filtering:
- Multiple pattern categories (class names, IDs, data attributes)
- Known ad network indicators
- False positive exclusion for legitimate content
- MutationObserver for dynamically loaded ads

### CSP Bypass

JavaScript modifications are executed using `chrome.scripting.executeScript` with `world: 'MAIN'`, which bypasses page Content Security Policy restrictions.

### Chunked Processing

For large pages, the extension supports:
- **Content Chunking**: Splits content at natural boundaries (paragraphs, headings)
- **Translation Batching**: Processes translations in batches of 15 text blocks
- **Summary Combination**: Summarizes chunks individually, then combines results

### Focus Mode (Eye Tracking)

Focus Mode uses computer vision to track where you're looking, highlighting text at that location for easier reading.

#### Eye Tracking (WebGazer.js)

- Uses standard webcams - no special hardware required
- Self-calibrates through user interactions (clicks, cursor movements)
- Predicts gaze location in real-time
- Supports data persistence between sessions

#### Focus Highlight Features

When text is detected at the gaze position:
- **Text Enlargement**: Increases font size by 150% for easier reading
- **Color Enhancement**: Changes text to high-contrast colors
- **Background Highlight**: Adds a subtle background glow
- **Smooth Transitions**: Animated focus changes for comfortable viewing
- **Auto-Reset**: Text automatically returns to original style when eyes look away
- **Continuous Reading**: Page scrolls slowly when looking at top or bottom edges for uninterrupted reading

#### Privacy

- All tracking runs locally in your browser
- No video or tracking data is sent to any server
- Camera access can be revoked at any time
- No data persists after closing the tab (unless calibration saving is enabled)

### Configuration Constants

Located in `config.js`:

```javascript
AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Best quality, slower' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast and efficient' },
]

DEFAULT_MODEL = 'gemini-3-pro-preview'

API_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: DEFAULT_MODEL,
  maxOutputTokens: 4096,
  temperature: 1.0
}

IMAGE_GENERATION_CONFIG = {
  model: 'gemini-3-pro-image-preview',     // Nano Banana Pro model for image generation
  maxImages: 4,                             // Maximum images per request (1-4)
  defaultAspectRatio: '4:3',                // Default aspect ratio
  defaultImageSize: '1K',                   // Default image size (1K, 2K, 4K)
  supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
  supportedImageSizes: ['1K', '2K', '4K']
}

CONTENT_LIMITS = {
  htmlSubstringLength: 15000,
  textSubstringLength: 5000,
  htmlContextLength: 20000
}

CHUNKING_CONFIG = {
  maxChunkSize: 8000,
  chunkOverlap: 200,
  translationBatchSize: 15
}

SCRIPT_CATEGORIES = {
  STATIC_SCRIPT: 'STATIC_SCRIPT',     // Can be saved and reused directly
  SAVABLE_RUNTIME: 'SAVABLE_RUNTIME', // Can be saved, executes fresh API call when applied
  RUNTIME_LLM: 'RUNTIME_LLM'          // Cannot be saved, requires fresh API call
}

FOCUS_MODE_CONFIG = {
  highlightRadius: 100,               // Pixels around gaze point to highlight
  fontSizeMultiplier: 1.5,            // Text enlargement factor
  transitionDuration: 200,            // Animation duration in ms
  gazeSmoothing: 5,                   // Number of frames to average for smooth tracking
  calibrationPoints: 9,               // Number of calibration points for eye tracking
  scrollZonePercent: 0.2,             // Percentage of viewport for scroll zones (20% = top/bottom 20%)
  scrollSpeed: 6,                     // Base pixels per frame to scroll
  scrollAcceleration: 1.5,            // Multiplier for scroll speed closer to edge
  scrollGazeDwellMs: 500,             // Time gaze must dwell in scroll zone before scrolling starts
  gazeTimeoutMs: 300                  // Time without gaze update before resetting highlights
}
```

## Security Considerations

- **No Network Requests**: Generated code is limited to DOM manipulation only
- **Local Storage**: API keys are stored locally using Chrome storage API
- **State Preservation**: Original page state is saved for reset functionality
- **CSP Compliance**: Extension uses approved Chrome APIs for code execution
- **Content Isolation**: Content script runs in an isolated context
- **Saved Scripts**: Stored locally, never transmitted externally

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Chromium-based versions
- **Brave**: Compatible

**Not Supported**:
- Firefox (uses Manifest V2)
- Safari
- Chrome pages (`chrome://`, `chrome-extension://`)
- Other browser internal pages

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Could not establish connection" | Refresh the page or ensure you're on a regular webpage |
| "API request failed" | Check your API key and network connection |
| Modifications not applying | Some sites have strict CSP; try the reset button |
| Content script not loading | Reload the extension from `chrome://extensions/` |
| Timeout errors | The AI service may be slow; try again later |
| Saved script not working | Script may be site-specific; try modifying prompts |
| Focus Mode camera not working | Ensure camera permissions are granted in browser settings |
| Eye tracking inaccurate | Complete the calibration by clicking on the screen while looking at cursor |

### Debug Mode

Open Chrome DevTools on the popup or inspect the service worker to see detailed logs:
- Popup: Right-click extension icon → "Inspect popup"
- Service Worker: Go to `chrome://extensions/` → "Service worker" link

All logs are prefixed with `[Browser Wand]` for easy filtering.

## Permissions

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab content |
| `scripting` | Inject content scripts and execute code |
| `storage` | Store API key, settings, and saved scripts |
| `<all_urls>` | Work on any website |

## License

MIT
