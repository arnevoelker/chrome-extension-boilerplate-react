# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension boilerplate built with:
- **React 18** for UI components
- **Webpack 5** for bundling
- **Manifest V3** for Chrome extension compatibility
- **TypeScript** support (demonstrated in Options and Panel pages)
- **Hot Module Replacement** for development efficiency

## Common Development Commands

```bash
# Install dependencies (requires Node.js >= 18)
npm install

# Start development server with hot reload
npm start

# Build production extension
npm build

# Format code with prettier
npm prettier
```

## Project Architecture

### Extension Pages Structure
The extension consists of multiple independent React entry points:
- **Popup** (`src/pages/Popup/`) - Extension popup window
- **Options** (`src/pages/Options/`) - Extension settings page (TypeScript)
- **Background** (`src/pages/Background/`) - Service worker for background tasks
- **Content Script** (`src/pages/Content/`) - Injected into web pages
- **Newtab** (`src/pages/Newtab/`) - Override new tab page
- **Devtools** (`src/pages/Devtools/`) - Developer tools integration
- **Panel** (`src/pages/Panel/`) - DevTools panel (TypeScript)

### Key Configuration Files
- `src/manifest.json` - Chrome extension manifest (V3)
- `webpack.config.js` - Webpack configuration with multiple entry points
- `utils/build.js` - Production build script
- `utils/webserver.js` - Development server configuration

### Build Output
- Development: Files are served from memory via webpack-dev-server
- Production: Built to `build/` directory, zipped to `zip/` directory

## Development Workflow

### Loading the Extension
1. Run `npm start` to start the development server
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build` folder

### Hot Reload Configuration
Content scripts and background scripts are excluded from hot reload by default (configured in `webpack.config.js` under `chromeExtensionBoilerplate.notHotReload`).

### TypeScript Usage
TypeScript is configured and can be used in any component. See `src/pages/Options/Options.tsx` and `src/pages/Panel/Panel.tsx` for examples.

### Port Configuration
Default development port is 3000. To use a different port:
```bash
PORT=6002 npm start
```

## Extension Components

### Content Scripts
- Configured in `manifest.json` under `content_scripts`
- Injected into all URLs by default
- Includes both JS (`contentScript.bundle.js`) and CSS (`content.styles.css`)

### Background Service Worker
- Uses Manifest V3 service worker pattern
- Entry point: `src/pages/Background/index.js`
- Handles extension-wide events and messaging

### Web Accessible Resources
Resources that can be accessed by web pages are defined in `manifest.json` under `web_accessible_resources`.