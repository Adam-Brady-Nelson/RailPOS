import { contextBridge } from 'electron'

declare global {
  interface Window {
    api?: {
      ping: () => string
    }
  }
}

contextBridge.exposeInMainWorld('api', {
  ping: () => 'pong',
})
