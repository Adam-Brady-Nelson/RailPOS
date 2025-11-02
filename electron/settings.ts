import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export type AppStyle = 'TAKEAWAY' | 'BAR';

export type AppSettings = {
  // Legacy single style (kept for backward-compat reads)
  style?: AppStyle;
  // New multi-style model
  enabledStyles: AppStyle[];
  activeStyle: AppStyle;
  createdAt: string;
  updatedAt: string;
};

const defaultSettings: AppSettings = {
  style: 'TAKEAWAY',
  enabledStyles: ['TAKEAWAY'],
  activeStyle: 'TAKEAWAY',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function getSettingsPath() {
  const dir = app.getPath('userData');
  return path.join(dir, 'settings.json');
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
    // Ensure active is in enabled
    if (!merged.enabledStyles.includes(merged.activeStyle)) {
      merged.enabledStyles = Array.from(new Set([...merged.enabledStyles, merged.activeStyle]));
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
  // Ensure active in enabled
  if (!next.enabledStyles.includes(next.activeStyle)) {
    next.enabledStyles = Array.from(new Set([...next.enabledStyles, next.activeStyle]));
  }
  const merged: AppSettings = { ...next, updatedAt: new Date().toISOString() };
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}
