## RailPOS — Copilot instructions (concise)

Quick orientation
- Tech: React + Vite (renderer) + Electron (main/preload) + SQLite (better-sqlite3) + TypeScript
- Dev: npm run dev runs Vite (HMR), tsup watch (Electron CJS build), then Electron with VITE_DEV_SERVER=true

Architecture and data flow
- Renderer (`src/`) is a React app served at http://localhost:5173 in dev. Entry: `src/main.tsx` → `src/App.tsx` (HashRouter)
- Electron main (`electron/main.ts`) owns all disk/DB access; renderer is sandboxed (contextIsolation=true)
- Preload (`electron/preload.ts`) exposes `window.db` via contextBridge; all renderer calls use ipcRenderer.invoke/on
- Databases (`electron/database.ts`):
  - Primary `railpos.sqlite` stores categories, dishes, customers
  - Per-shift orders DB at `shifts/orders-YYYY-MM-DD.sqlite`; active shift tracked by `shifts/current-shift.json`
  - Paths: dev uses process.cwd(); production uses app.getPath('userData')

IPC surface (canonical)
- Menu: `get-categories`, `get-dishes(categoryId)`, `create-category(name)`, `update-category(id,name)`, `delete-category(id)`, `create-dish(payload)`, `update-dish(id,payload)`, `delete-dish(id)`
- Customers: `create-or-update-customer(customer)`, `search-customers-by-phone(query,limit)`
- Orders: `create-customer-and-order({ customer, phoneId })`, `create-order-with-items({ customerId, phoneId, items, fulfillment?, payment_method? })`, `update-order-items({ orderId, items })`, `get-order-details(orderId)`, `finalize-payment({ orderId, payment_method })`, `get-orders-today()`
- Analytics: `get-daily-totals()`, `get-revenue-breakdown-today()`
- Shifts: `start-shift()` → `{ path, date }`, `get-current-shift()` → `{ path, date } | null`, `close-shift()`
- Setup: `is-db-present()`, `initialize-db()`
- Broadcasts: main emits `data-changed` `{ entity, action, id, category_id? }`; subscribe via `window.db.onDataChanged(handler)` → unsubscribe fn

Renderer patterns (see files)
- Menu browse: `await window.db.getCategories()` then `getDishes(catId)` with live refresh on `data-changed` (see `src/pages/OrderScreen.tsx`)
- New customer → order: `src/pages/CustomerForm.tsx` calls `createOrUpdateCustomer` then navigates to `/order/new` with state; checkout uses `createOrderWithItems` (cash/card)
- Orders list: `src/pages/OrderList.tsx` calls `getOrdersToday()`; surfaces `NO_ACTIVE_SHIFT`; selects fetch `getOrderDetails(id)` and auto-refreshes on `data-changed`
- Shift controls: `src/components/ShiftControls.tsx` uses `startShift()`/`closeShift()` and guards browser-only runs (no `window.db`)
- Setup: `src/pages/Setup.tsx` uses `isDbPresent()`/`initializeDb()` for first-run schema

Workflows and commands
- Install: npm install (postinstall builds native deps for Electron)
- Dev: npm run dev (tsup → dist-electron/*.cjs, Vite HMR, Electron loads Vite URL + DevTools)
- Build: npm run build (tsup then Vite)
- Run built: npm run electron
- Package: npm run package:linux|win|mac|all
- Checks: npm run test (eslint + tsc)

Conventions and gotchas
- Never import native modules from renderer; add IPC in main and mirror in preload so `window.db` stays typed/complete
- tsup outputs CommonJS to `dist-electron`; preload is `preload.cjs` loaded via BrowserWindow.webPreferences.preload
- Orders DB requires an active shift; `getOrdersDb()` throws `NO_ACTIVE_SHIFT` (UI handles in `OrderList.tsx`)
- Use `data-changed` broadcasts to refresh views instead of manual reloads
- When running Vite in browser, `window.db` is unavailable—use Electron runtime to test features

Key files
- `electron/main.ts` (IPC + window lifecycle), `electron/preload.ts` (`window.db` API + types), `electron/database.ts` (schema + shift DB), `tsup.config.ts`, `vite.config.js`, `package.json`, renderer in `src/pages/*` and `src/components/*`

Editing rules for agents
- If you change an IPC name/signature, update main, preload, and all renderer callsites together; keep return shapes (`lastInsertRowid`, `.changes`, etc.) consistent
- After Electron edits, run dev to recompile `dist-electron` and verify in DevTools; prefer `data-changed` to refresh views

Questions / gaps
- If stricter typings for `window.db` are desired, propose an interface in `preload.ts` and propagate to components
