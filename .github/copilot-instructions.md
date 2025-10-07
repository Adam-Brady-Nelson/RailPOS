## RailPOS — Copilot instructions (concise)

Quick orientation
- Tech: React + Vite (renderer) + Electron (main/preload) + SQLite (better-sqlite3)
- Dev: npm run dev starts Vite, tsup (Electron build/watch) and then Electron; prod uses npm run build + electron-builder

Architecture and data flow
- Renderer (src/) is a React app served at http://localhost:5173 in dev. Entry: `src/main.tsx` → `src/App.tsx` (HashRouter)
- Electron main (`electron/main.ts`) owns all disk/DB access; renderer stays sandboxed (contextIsolation=true)
- Preload (`electron/preload.ts`) exposes `window.db` via contextBridge; all renderer calls go through ipcRenderer.invoke/on
- Databases (`electron/database.ts`):
  - Primary DB `railpos.sqlite` stores categories, dishes, customers
  - Per-shift Orders DB lives in `shifts/orders-YYYY-MM-DD.sqlite`; active shift tracked by `shifts/current-shift.json`

IPC surface (canonical)
- Categories/Dishes: `get-categories()`, `get-dishes(categoryId)`, `create-category(name)`, `update-category(id,name)`, `delete-category(id)`, `create-dish(payload)`, `update-dish(id,payload)`, `delete-dish(id)`
- Customers/Orders: `create-customer-and-order({ customer, phoneId })` → `{ customerId, orderId }`, `get-orders-today()`
- Shifts: `start-shift()` → `{ path, date }`, `get-current-shift()` → `{ path, date } | null`, `close-shift()`
- Broadcasts: after mutations main sends `data-changed` with `{ entity, action, id, category_id? }`; subscribe via `window.db.onDataChanged(handler)` → unsubscribe fn

Renderer patterns (see files)
- Menus: `await window.db.getCategories()` then `getDishes(catId)` (see `src/components/OrderScreen.tsx`)
- New customer + order: `await window.db.createCustomerAndOrder({ customer, phoneId })` then navigate to `/order/:orderId` (see `CustomerForm.tsx`)
- Orders list: `await window.db.getOrdersToday()`; handle `NO_ACTIVE_SHIFT` error if no shift (see `OrderList.tsx`)
- Shift controls: call `startShift()`/`closeShift()` from UI (see `MainScreen.tsx`)

Workflows and commands
- Install deps: npm install (postinstall builds native deps for Electron)
- Dev: npm run dev (uses VITE_DEV_SERVER=true to load Vite URL and open DevTools)
- Build: npm run build (tsup → dist-electron/*.cjs, then vite → dist/)
- Run current dist-electron: npm run electron; Package: npm run package:linux|win|mac|all

Conventions and gotchas
- Never import native modules from renderer; add IPC in main and mirror types/impl in preload so `window.db` stays complete
- tsup outputs CommonJS for Electron; preload is emitted as `preload.cjs` and loaded via `BrowserWindow` webPreferences.preload
- DB locations: dev uses `process.cwd()`; production uses `path.dirname(app.getPath('exe'))`. Look for `railpos.sqlite` and `shifts/` in project root during dev
- Orders DB requires an active shift; `getOrdersDb()` throws `NO_ACTIVE_SHIFT` that the UI surfaces in `OrderList.tsx`

Key files
- `electron/main.ts` (IPC + window lifecycle), `electron/preload.ts` (`window.db` typings), `electron/database.ts` (schema + shift DB), `src/components/*` usage examples, `tsup.config.ts`, `vite.config.js`, `package.json`

Editing rules for agents
- If you change an IPC name/signature, update main, preload, and all renderer callsites together; keep return shapes (`lastInsertRowid` or `.changes`) consistent
- After Electron code edits, run dev to recompile `dist-electron` and verify in DevTools; prefer using `data-changed` to refresh views instead of manual reloads

Questions / gaps
- If stricter typings for `window.db` are desired, propose an interface in `preload.ts` and propagate to components
