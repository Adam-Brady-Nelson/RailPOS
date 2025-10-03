# RailPOS

A modern Point of Sale (POS) system for restaurants built with React, Vite, Electron, and SQLite. RailPOS provides a desktop application for managing orders, menus, and customer information.

## Features
- **Multi-phone order management**: Support for multiple ordering stations (Phone 1, Phone 2)
- **Customer information capture**: Collect customer name, phone, and address
- **Menu management**: Organize dishes by categories (Starters, Mains, Desserts, Drinks)
- **SQLite database**: Local database for storing categories, dishes, and order information
- **Real-time updates**: IPC communication between Electron main and renderer processes
- **Cross-platform**: Runs on Linux, Windows, and macOS

## Tech Stack
- React 18 with TypeScript
- Vite for fast development and hot module replacement
- Electron for desktop application framework
- SQLite (via better-sqlite3) for data persistence
- TailwindCSS for styling
- React Router for navigation

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```

2. Start in development mode
   ```bash
   npm run dev
   ```

3. Build the web assets
   ```bash
   npm run build
   ```

4. Package the desktop app (optional)
   - Linux: `npm run package:linux` (AppImage)
   - Windows: `npm run package:win` (NSIS installer)
   - macOS: `npm run package:mac` (DMG)
   - All platforms: `npm run package:all`

## Development Notes
- In dev mode, Electron loads the Vite dev server at http://localhost:5173
- In production, Electron loads the built assets from `dist/index.html`
- The SQLite database file `railpos.sqlite` is created automatically in the application directory
- Database is initialized with sample categories and dishes on first run
