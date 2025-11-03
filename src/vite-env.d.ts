/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    api?: {
      ping: () => string
    }
    settings: {
      get: () => Promise<{ enabledStyles: Array<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>; activeStyle: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; style?: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; restaurantLayout?: Array<{ id:string; name:string; x:number; y:number; w:number; h:number }> }>
      set: (partial: Partial<{ enabledStyles: Array<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>; activeStyle: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; style?: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; restaurantLayout?: Array<{ id:string; name:string; x:number; y:number; w:number; h:number }> }>) => Promise<{ enabledStyles: Array<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>; activeStyle: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; style?: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; restaurantLayout?: Array<{ id:string; name:string; x:number; y:number; w:number; h:number }> }>
      onChanged: (cb: (s: { enabledStyles: Array<'TAKEAWAY' | 'BAR' | 'RESTAURANT'>; activeStyle: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; style?: 'TAKEAWAY' | 'BAR' | 'RESTAURANT'; restaurantLayout?: Array<{ id:string; name:string; x:number; y:number; w:number; h:number }> }) => void) => () => void
    }
  }
}
