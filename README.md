<p align="center">
  <img src="chrome-extension/icons/icon128.png" alt="Browser Wand Logo" width="120" height="120">
</p>

<h1 align="center">Browser Wand</h1>

<p align="center">
  <strong>Transform any webpage with AI-powered magic</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#examples">Examples</a> •
  <a href="#technology">Technology</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/AI-Gemini%203-purple?style=flat-square" alt="Gemini 3">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=flat-square" alt="Version 1.0.0">
</p>

## The Era of Static Browsing is Over

Most AI browser tools feel like a distraction—a chatbot confined to a sidebar, merely reading content aloud. **Browser Wand is different.** It doesn't just interpret the page; it transforms it entirely. By seamlessly integrating the Gemini API directly into the DOM, we empower you with complete ownership of your browsing experience.

> *Your browser should obey you.*

Interact with your browser using nothing but your eyes. Whether you want to wipe away ads, translate languages side-by-side, or completely redesign a website to look like a cyberpunk terminal—Browser Wand makes it happen with a simple prompt.

---

## Features

### Focus Mode — Navigate with Your Eyes

Our revolutionary gaze-tracking technology uses WebGazer.js to highlight text as you read, keeping you in the flow. Auto-scroll follows your gaze, so you never need to touch your mouse while reading.

- Real-time eye tracking with webcam
- Intelligent text highlighting at gaze position
- Automatic scrolling based on where you're looking
- Calibration overlay for optimal accuracy

### Thematic Reskinning — Redesign Any Website

Bored with a white background? Tell the Wand to transform the entire UI instantly.

```
"Make this look like a 1920s newspaper"
"Apply a cyberpunk neon theme"
"Transform into a children's storybook"
"Give it an 80s synthwave aesthetic"
```

Supports dozens of styles: retro, vintage, hacker terminal, matrix, steampunk, gothic, medieval, futuristic, pixel art, art deco, minimalist, brutalist, and more.

### Smart Decluttering — Isolate What Matters

One command removes distractions and extracts the content you actually want to read.

- **Ad Removal** — Eliminate advertisements, banners, and popups
- **Comment Hiding** — Remove discussion sections and replies
- **Content Extraction** — Reader mode that isolates the main article
- **Element Hiding** — Target specific elements to hide

### Intelligent Runtime — AI That Understands Context

Get powerful AI assistance without leaving your tab.

| Feature | Description |
|---------|-------------|
| **Side-by-Side Translation** | Bilingual text display in 20+ languages |
| **Instant Summaries** | TL;DR of any article or page |
| **Deep Analysis** | Answer questions about page content |
| **Content Insertion** | Add generated content directly into the page |

### The Magic Bar — Your Gateway to the World

A universal search interface powered by Google Search grounding and AI image generation.

- **Product Search** — Find similar products across e-commerce sites
- **News Discovery** — Get relevant articles about any topic
- **Image Generation** — Create AI images displayed directly on the page
- **Web Search** — Ask anything and get AI-powered answers

---

## Installation

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/user/browser-wand.git
   cd browser-wand
   ```

2. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Configure your API key**
   - Click the Browser Wand icon in your toolbar
   - Open Settings (gear icon)
   - Enter your [Gemini API key](https://aistudio.google.com/apikey)
   - Choose your preferred model (Pro or Flash)

---

## Usage

### Page Modifier

Type any natural language command to modify the current page:

```
"Enable dark mode"
"Hide all advertisements"
"Make the header sticky"
"Increase font size to 18px"
"Add a red border to all images"
```

### Magic Bar

Search the web or generate images without leaving your tab:

```
"Find laptops under $1000"
"Generate an image of a sunset over mountains"
"What is the latest news about AI?"
"Find products similar to this"
```

### Focus Mode

1. Click "Start Eye Tracking" in the popup
2. Grant camera permission when prompted
3. Complete the calibration by clicking around the screen
4. Start reading—text will highlight as your eyes move
5. Look at the top/bottom 20% of the screen to auto-scroll

---

## Examples

| Command | Result |
|---------|--------|
| `"Remove all ads"` | Hides advertisements, banners, and sponsored content |
| `"Translate to Spanish side by side"` | Adds Spanish translations next to original text |
| `"Make this a dark theme"` | Applies dark mode styling to the entire page |
| `"Summarize this article"` | Displays a concise summary in a modal |
| `"Extract main content only"` | Enables reader mode with just the article |
| `"Make it look like a hacker terminal"` | Green text on black with monospace font |
| `"Generate an image of this product"` | Creates and displays an AI-generated image |

---

## Technology

### Core Stack

- **Chrome Extension Manifest V3** — Modern, secure extension architecture
- **Gemini 3 Pro / Flash** — State-of-the-art AI models for content understanding
- **WebGazer.js** — Real-time eye tracking via webcam
- **Google Search Grounding** — Real-time web search capabilities

### Intelligent Task Detection

Browser Wand automatically understands your intent and routes requests to specialized handlers:

- Content extraction and reader mode
- Ad and comment removal
- Thematic reskinning and styling
- Translation with bilingual display
- Summarization and analysis
- Web search and image generation

### Privacy First

- All processing happens locally in your browser
- API key stored securely in Chrome storage
- Camera access only when Focus Mode is active
- No data collection or external tracking

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current page content for modification |
| `scripting` | Inject CSS and JavaScript for transformations |
| `storage` | Save API key and user preferences |
| `<all_urls>` | Enable functionality on any website |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License—see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Browser Wand</strong> — Because your browser should obey you.
</p>
