import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    db: {
      getCategories: () => Promise<any[]>
      getDishes: (categoryId: number) => Promise<any[]>
      createCategory: (name: string) => Promise<number>
      updateCategory: (id: number, name: string) => Promise<number>
      deleteCategory: (id: number) => Promise<number>
      createDish: (payload: { name: string; price: number; category_id: number }) => Promise<number>
      updateDish: (id: number, payload: { name?: string; price?: number; category_id?: number }) => Promise<number>
      deleteDish: (id: number) => Promise<number>
      onDataChanged: (handler: (event: { entity: string; action: string; id: number | string; category_id?: number }) => void) => () => void
    }
  }
}

contextBridge.exposeInMainWorld('db', {
  getCategories: () => ipcRenderer.invoke('get-categories'),
  getDishes: (categoryId: number) => ipcRenderer.invoke('get-dishes', categoryId),
  createCategory: (name: string) => ipcRenderer.invoke('create-category', name),
  updateCategory: (id: number, name: string) => ipcRenderer.invoke('update-category', id, name),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),
  createDish: (payload: { name: string; price: number; category_id: number }) => ipcRenderer.invoke('create-dish', payload),
  updateDish: (id: number, payload: { name?: string; price?: number; category_id?: number }) => ipcRenderer.invoke('update-dish', id, payload),
  deleteDish: (id: number) => ipcRenderer.invoke('delete-dish', id),
  onDataChanged: (handler: (event: { entity: string; action: string; id: number | string; category_id?: number }) => void) => {
    const listener = (_: unknown, payload: any) => handler(payload)
    ipcRenderer.on('data-changed', listener)
    return () => ipcRenderer.removeListener('data-changed', listener)
  },
})
