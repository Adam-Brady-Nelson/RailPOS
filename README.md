# React + Vite + Electron template

This is a minimal template that wires up React (Vite) with Electron for desktop apps.

Features
- Vite dev server for React + hot reload
- Electron main + preload with contextIsolation
- Single `dev` command that starts Vite and Electron together
- Packaging via electron-builder (AppImage, NSIS, DMG targets)

Getting started
1. Install dependencies
   - npm install
2. Start in development
   - npm run dev
3. Build the web assets
   - npm run build
4. Package the desktop app (optional)
   - Linux: npm run package:linux (AppImage)
   - Windows: npm run package:win (NSIS installer)
   - macOS: npm run package:mac (DMG)
   - All platforms (on respective OS or CI): npm run package:all

Notes
- In dev, Electron loads http://localhost:5173. In production, it loads `dist/index.html`.
- Preload exposes a tiny `window.api.ping()` function as an example.
