/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    api?: {
      ping: () => string
    }
    settings: {
      get: () => Promise<{ enabledStyles: Array<'TAKEAWAY' | 'BAR'>; activeStyle: 'TAKEAWAY' | 'BAR'; style?: 'TAKEAWAY' | 'BAR' }>
      set: (partial: Partial<{ enabledStyles: Array<'TAKEAWAY' | 'BAR'>; activeStyle: 'TAKEAWAY' | 'BAR'; style?: 'TAKEAWAY' | 'BAR' }>) => Promise<{ enabledStyles: Array<'TAKEAWAY' | 'BAR'>; activeStyle: 'TAKEAWAY' | 'BAR'; style?: 'TAKEAWAY' | 'BAR' }>
      onChanged: (cb: (s: { enabledStyles: Array<'TAKEAWAY' | 'BAR'>; activeStyle: 'TAKEAWAY' | 'BAR'; style?: 'TAKEAWAY' | 'BAR' }) => void) => () => void
    }
  }
}
