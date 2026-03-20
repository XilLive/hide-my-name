# Hide My Name

A Chrome extension for live streamers to hide personal information (names, addresses, etc.) on web pages in real-time - before it ever appears on screen.

## Features

- **Zero-flash replacement** - Hides the page at `document_start` and scrubs text before anything renders, so viewers never see your real info.
- **Whole-word matching** - "alex" will not match "alexandria". Only exact word/phrase boundaries are replaced.
- **Per-word replacements** - Each hidden word can have its own replacement, or fall back to a global Display Name.
- **Live updates** - Changes apply instantly to all open tabs without reloading.
- **Attribute coverage** - Also replaces text inside `placeholder`, `value`, `title`, `alt`, and `aria-label` attributes.
- **Enable/disable toggle** - Quickly turn the extension on or off.
- **Works on all sites** - Runs on every page and iframe.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions/` in Google Chrome.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `hide-my-name` folder.
5. The extension icon will appear in your toolbar.

## Usage

1. Click the extension icon in the Chrome toolbar.
2. Set your **Display Name** - this is the default replacement text (e.g. "Sir Gumdrop").
3. Add words or phrases you want to hide:
   - **Word or phrase to hide** - your real name, address, city, etc.
   - **Replace with** (optional) - a custom replacement for that specific word. Leave blank to use your Display Name.
4. Edit or remove rules at any time using the pencil and X buttons.
5. Use the toggle switch to quickly enable or disable the extension.

## How It Works

- The content script runs at `document_start` (before the page renders) and immediately sets `visibility: hidden` on the body.
- It loads your rules from `chrome.storage.sync`, scrubs all matching text nodes and attributes, then reveals the page.
- A `MutationObserver` watches for any new DOM content (SPA navigation, lazy-loaded content, AJAX updates) and replaces matches on the fly.
- Word boundaries (`\b`) ensure only whole-word matches are replaced.

## Project Structure

```
hide-my-name/
  manifest.json      Manifest V3 extension config
  content.js         Content script - text replacement engine
  popup.html         Extension popup UI
  popup.js           Popup logic - rule management
  popup.css          Dark theme styles
  background.js      Service worker - sets defaults on install
  icons/             Icon assets
```

## License

MIT
