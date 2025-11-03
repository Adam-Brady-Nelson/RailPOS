import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export type AppStyle = 'TAKEAWAY' | 'BAR' | 'RESTAURANT';

export type RestaurantTable = {
  id: string;
  name: string;
  x: number; // px within canvas
  y: number; // px within canvas
  w: number; // px
  h: number; // px
};

export type AppSettings = {
  // Legacy single style (kept for backward-compat reads)
  style?: AppStyle;
  // New multi-style model
  enabledStyles: AppStyle[];
  activeStyle: AppStyle;
  // Restaurant layout (optional)
  restaurantLayout?: RestaurantTable[];
  createdAt: string;
  updatedAt: string;
};

const defaultSettings: AppSettings = {
  style: 'TAKEAWAY',
  enabledStyles: ['TAKEAWAY'],
  activeStyle: 'TAKEAWAY',
  restaurantLayout: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function getSettingsPath() {
  // In dev (Vite-driven Electron), prefer writing to the project cwd so files are visible in the repo folder.
  const isDev = process.env.VITE_DEV_SERVER === 'true' || !app.isPackaged || process.env.NODE_ENV === 'development';
  const baseDir = isDev ? process.cwd() : app.getPath('userData');
  return path.join(baseDir, 'settings.json');
}

export function readSettings(): AppSettings {
  try {
    const p = getSettingsPath();
    if (!fs.existsSync(p)) return defaultSettings;
    const data = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<AppSettings>;
    const merged: AppSettings = { ...defaultSettings, ...data } as AppSettings;
    // Normalize: if legacy 'style' is present but enabledStyles missing, derive from it
    if ((!merged.enabledStyles || merged.enabledStyles.length === 0) && merged.style) {
      merged.enabledStyles = [merged.style];
    }
    if (!merged.activeStyle) {
      merged.activeStyle = merged.style ?? merged.enabledStyles[0] ?? 'TAKEAWAY';
    }
    // Ensure active is valid: if active not enabled, pick first enabled instead of mutating enabled set
    if (!merged.enabledStyles.includes(merged.activeStyle)) {
      merged.activeStyle = merged.enabledStyles[0] ?? 'TAKEAWAY';
    }
    return merged;
  } catch {
    return defaultSettings;
  }
}

export function writeSettings(partial: Partial<AppSettings>): AppSettings {
  const current = readSettings();
  const next: AppSettings = { ...current };
  // Map legacy single 'style' to multi-style fields if provided
  if (partial.style) {
    next.style = partial.style;
    next.enabledStyles = [partial.style];
    next.activeStyle = partial.style;
  }
  if (partial.enabledStyles) {
    next.enabledStyles = Array.from(new Set(partial.enabledStyles));
    // Ensure at least one style
    if (next.enabledStyles.length === 0) next.enabledStyles = current.enabledStyles.length ? current.enabledStyles : ['TAKEAWAY'];
  }
  if (partial.activeStyle) {
    next.activeStyle = partial.activeStyle;
  }
  // Restaurant layout persistence
  if (partial.restaurantLayout) {
    // Shallow-validate shape and store
    try {
      next.restaurantLayout = partial.restaurantLayout.map(t => ({ id: String(t.id), name: String(t.name), x: Number(t.x), y: Number(t.y), w: Number(t.w), h: Number(t.h) }));
    } catch {
      // If mapping fails, keep existing layout
    }
  }
  // Ensure active is valid: if not enabled, switch to first enabled rather than altering enabled set
  if (!next.enabledStyles.includes(next.activeStyle)) {
    next.activeStyle = next.enabledStyles[0] ?? 'TAKEAWAY';
  }
  const merged: AppSettings = { ...next, updatedAt: new Date().toISOString() };
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(merged, null, 2), 'utf8');
  try {
    console.log('[Settings] Saved to', p, 'enabledStyles=', merged.enabledStyles, 'activeStyle=', merged.activeStyle, 'layout=', (merged.restaurantLayout?.length ?? 0));
  } catch { /* ignore logging errors */ }
  return merged;
}
