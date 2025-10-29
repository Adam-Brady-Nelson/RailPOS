import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    db: {
  getCategories: () => Promise<Array<{ id:number; name:string }>>
  getDishes: (categoryId: number) => Promise<Array<{ id:number; name:string; price:number; category_id:number }>>
      createCategory: (name: string) => Promise<number>
      updateCategory: (id: number, name: string) => Promise<number>
      deleteCategory: (id: number) => Promise<number>
      createDish: (payload: { name: string; price: number; category_id: number }) => Promise<number>
      updateDish: (id: number, payload: { name?: string; price?: number; category_id?: number }) => Promise<number>
      deleteDish: (id: number) => Promise<number>
      createCustomerAndOrder: (payload: { customer: { name: string; phone: string; address: string }, phoneId: number }) => Promise<{ customerId: number, orderId: number }>
  createOrUpdateCustomer: (customer: { name: string; phone: string; address: string }) => Promise<{ customerId: number }>
  createOrderWithItems: (payload: { customerId: number; phoneId: number; fulfillment?: 'delivery' | 'collection'; items: Array<{ dish_id: number; quantity: number; price: number }>, payment_method?: 'cash' | 'card' }) => Promise<{ orderId: number }>
  getOrdersToday: () => Promise<Array<{ id: number; created_at: string; status: string; phone_id: number; fulfillment: 'delivery' | 'collection'; customer_name?: string; customer_phone?: string; total: number }>>
      getDailyTotals: () => Promise<{ total: number; orders: number }>
      getRevenueBreakdownToday: () => Promise<{ cash: number; card: number; total: number }>
      getOrderDetails: (orderId: number) => Promise<{
        order: { id:number; status:string; phone_id:number; payment_method: string | null; fulfillment: 'delivery' | 'collection'; created_at:string },
        customer: { id:number; name:string; phone:string; address:string } | null,
        items: Array<{ dish_id:number; name:string; quantity:number; price:number }>,
        subtotal: number
      } | null>
      searchCustomersByPhone: (query: string, limit?: number) => Promise<Array<{ id:number; name:string; phone:string; address:string }>>
      updateOrderItems: (payload: { orderId: number; items: Array<{ dish_id:number; quantity:number; price:number }> }) => Promise<boolean>
      finalizePayment: (payload: { orderId: number; payment_method: 'cash' | 'card' }) => Promise<boolean>
      startShift: () => Promise<{ path: string; date: string }>
      getCurrentShift: () => Promise<{ path: string; date: string } | null>
  closeShift: () => Promise<boolean>
      // Setup / bootstrap
      isDbPresent: () => Promise<boolean>
      initializeDb: () => Promise<boolean>
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
  createCustomerAndOrder: (payload: { customer: { name: string; phone: string; address: string }, phoneId: number }) => ipcRenderer.invoke('create-customer-and-order', payload),
  createOrUpdateCustomer: (customer: { name: string; phone: string; address: string }) => ipcRenderer.invoke('create-or-update-customer', customer),
  createOrderWithItems: (payload: { customerId: number; phoneId: number; fulfillment?: 'delivery' | 'collection'; items: Array<{ dish_id: number; quantity: number; price: number }>, payment_method?: 'cash' | 'card' }) => ipcRenderer.invoke('create-order-with-items', payload),
  getOrdersToday: () => ipcRenderer.invoke('get-orders-today'),
  getDailyTotals: () => ipcRenderer.invoke('get-daily-totals'),
  getRevenueBreakdownToday: () => ipcRenderer.invoke('get-revenue-breakdown-today'),
  getOrderDetails: (orderId: number) => ipcRenderer.invoke('get-order-details', orderId),
  searchCustomersByPhone: (query: string, limit?: number) => ipcRenderer.invoke('search-customers-by-phone', query, limit),
  updateOrderItems: (payload: { orderId: number; items: Array<{ dish_id:number; quantity:number; price:number }> }) => ipcRenderer.invoke('update-order-items', payload),
  finalizePayment: (payload: { orderId: number; payment_method: 'cash' | 'card' }) => ipcRenderer.invoke('finalize-payment', payload),
  startShift: () => ipcRenderer.invoke('start-shift'),
  getCurrentShift: () => ipcRenderer.invoke('get-current-shift'),
  closeShift: () => ipcRenderer.invoke('close-shift'),
  // Setup / bootstrap
  isDbPresent: () => ipcRenderer.invoke('is-db-present'),
  initializeDb: () => ipcRenderer.invoke('initialize-db'),
  onDataChanged: (handler: (event: { entity: string; action: string; id: number | string; category_id?: number }) => void) => {
    const listener = (_: unknown, payload: unknown) => handler(payload as { entity: string; action: string; id: number | string; category_id?: number })
    ipcRenderer.on('data-changed', listener)
    return () => ipcRenderer.removeListener('data-changed', listener)
  },
})
