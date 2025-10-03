## RailPOS — Copilot Instructions (concise)

Quick orientation
- Tech: React + Vite (renderer) + Electron (main/preload) + SQLite (better-sqlite3).
- How it runs in dev: `npm run dev` starts Vite, tsup (electron build watch) and Electron. Production uses `npm run build` then electron-builder packaging.

High-level architecture and why
- Renderer (src/) is a standard React app bundled by Vite and served at http://localhost:5173 in dev. Entry: `src/main.tsx` -> `src/App.tsx`.
- Electron main process (electron/main.ts) owns the SQLite DB and all direct disk/DB access. This isolates native modules and keeps the renderer sandboxed (contextIsolation=true).
- Preload (electron/preload.ts) exposes a thin, explicit API on `window.db` using `contextBridge` and `ipcRenderer.invoke` + `ipcRenderer.on`. Use this API for all DB interactions — do not import better-sqlite3 from renderer code.
- Database initialization and seed data live in `electron/database.ts`. The DB file is `railpos.sqlite` and its path changes between dev and packaged builds (see `isDev` logic).

IPC / API surface (canonical reference)
- Handlers registered in `electron/main.ts` (ipcMain.handle):
  - `get-categories()` -> returns categories array
  - `get-dishes(categoryId)` -> returns dishes array
  - `create-category(name)` -> returns lastInsertRowid
  - `update-category(id, name)` -> returns number of changes
  - `delete-category(id)` -> returns number of changes
  - `create-dish(payload)` -> returns lastInsertRowid
  - `update-dish(id, payload)` -> returns number of changes
  - `delete-dish(id)` -> returns number of changes
- Event broadcast: main sends `data-changed` to all windows after any mutation. Renderer-side helper `window.db.onDataChanged(handler)` returns an unsubscribe function.

Renderer usage patterns (concrete examples)
- Fetch categories: `const cats = await window.db.getCategories()` (see `src/components/OrderScreen.tsx`).
- Fetch dishes for selected category: `await window.db.getDishes(categoryId)`.
- Perform create/update/delete and rely on `data-changed` to refresh views — handlers in main broadcast change metadata (entity, action, id, category_id).

Dev/build/debug workflows (must-know commands)
- Install: `npm install` (postinstall runs electron-builder install-app-deps).
- Dev (recommended): `npm run dev` — runs Vite (renderer), `tsup --watch` to compile Electron code to `dist-electron`, and then launches Electron after Vite is ready.
  - Dev env uses env var `VITE_DEV_SERVER=true` — main checks this to decide whether to load `http://localhost:5173` or the built `dist/index.html`.
- Build web + electron bundle: `npm run build` (runs `tsup` then `vite build`).
- Run packaged electron (manual): `npm run electron` (runs Electron against current dist-electron/main.cjs).
- Package installers: `npm run package:linux|win|mac|all` (uses electron-builder). See `package.json` "build" section for artifact layout.
- Lint / types: `npm run lint`, `npm run typecheck`.

Project-specific conventions & gotchas
- All native/DB work happens in the main process. Do not add native modules to renderer. If you add IPC handlers, mirror their types in `preload.ts` so `window.db` remains complete.
- tsup produces CommonJS electron output and the package.json `main` points at `dist-electron/main.cjs`. Preload file is emitted as `preload.cjs` (main loads that path). When editing Electron code, run `tsup`/`npm run dev` to rebuild the main bundle.
- Database path: in dev the DB path is `process.cwd()`; in production it's next to the packaged executable (`path.dirname(app.getPath('exe'))`). When testing DB changes in dev, check the workspace root for `railpos.sqlite`.
- IPC return values: mutation handlers return `lastInsertRowid` or number-of-changes. Consumers expect those values; follow existing patterns when adding new handlers.
- UI navigation uses HashRouter (`src/App.tsx`) — generate links like `#/customer-form/1` when simulating routes directly.

Key files to inspect when changing behavior
- `electron/main.ts` — IPC handlers, window creation, dev vs prod loading.
- `electron/preload.ts` — window.db surface and typings for renderer.
- `electron/database.ts` — DB schema, seed data, `railpos.sqlite` location.
- `src/components/OrderScreen.tsx`, `CustomerForm.tsx`, `MainScreen.tsx` — canonical renderer usage of `window.db` and routing.
- `package.json` — scripts for dev, build, packaging, and electron-builder config.
- `vite.config.js`, `tsup.config.ts` — bundling configs for renderer and electron.

Search tips for agents
- To find IPC additions or event usage search for `ipcMain.handle`, `ipcRenderer.invoke`, `data-changed`, or `window.db`.

When you make edits
- If you change an IPC channel name or handler signature, update both `electron/main.ts` and `electron/preload.ts`, and update all renderer callsites in `src/components`.
- Run `npm run dev` and verify the renderer prints expected logs; open DevTools (Electron auto-opens it in dev) to inspect errors or missing handlers.

If something's missing
- No test harness is present. Add a small smoke test script that invokes `window.db` handlers via an automated Electron run if you need CI-level checks.

Questions / next steps
- Is there a preferred typing policy for `window.db` (strict interfaces vs `any`)? Tell me and I can add type stubs or update `preload.ts` declarations.
