import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { initializeDatabase, getOrdersDb, startNewShift, getCurrentShift, closeCurrentShift } from './database'
import db from './database'
// Shift controls
ipcMain.handle('close-shift', async () => {
  closeCurrentShift();
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'shift', action: 'close' }));
  // Ensure window regains focus after closing shift
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (win) win.focus()
  return true;
})

// In CJS output, Node provides __dirname automatically; tsup CJS transpile will retain it.

const isDev = process.env.VITE_DEV_SERVER === 'true'
const VITE_DEV_SERVER_URL = 'http://localhost:5173'

let mainWindow: BrowserWindow | null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    const indexHtml = path.join(__dirname, '../dist/index.html')
    await mainWindow.loadFile(indexHtml)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers
ipcMain.handle('get-categories', async () => {
  return db.prepare('SELECT * FROM categories').all();
})

ipcMain.handle('get-dishes', async (_event, categoryId) => {
  return db.prepare('SELECT * FROM dishes WHERE category_id = ?').all(categoryId);
})

// CRUD: Categories
ipcMain.handle('create-category', async (_e, name: string) => {
  const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'category', action: 'create', id: info.lastInsertRowid }))
  return info.lastInsertRowid
})

ipcMain.handle('update-category', async (_e, id: number, name: string) => {
  const info = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'category', action: 'update', id }))
  return info.changes
})

ipcMain.handle('delete-category', async (_e, id: number) => {
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'category', action: 'delete', id }))
  return info.changes
})

// CRUD: Dishes
ipcMain.handle('create-dish', async (_e, payload: { name: string; price: number; category_id: number }) => {
  const info = db.prepare('INSERT INTO dishes (name, price, category_id) VALUES (?, ?, ?)').run(payload.name, payload.price, payload.category_id)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'dish', action: 'create', id: info.lastInsertRowid, category_id: payload.category_id }))
  return info.lastInsertRowid
})

ipcMain.handle('update-dish', async (_e, id: number, payload: { name?: string; price?: number; category_id?: number }) => {
  const current = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id) as { id: number; name: string; price: number; category_id: number } | undefined
  if (!current) return 0
  const name = payload.name ?? current.name
  const price = payload.price ?? current.price
  const category_id = payload.category_id ?? current.category_id
  const info = db.prepare('UPDATE dishes SET name = ?, price = ?, category_id = ? WHERE id = ?').run(name, price, category_id, id)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'dish', action: 'update', id, category_id }))
  return info.changes
})

ipcMain.handle('delete-dish', async (_e, id: number) => {
  const current = db.prepare('SELECT category_id FROM dishes WHERE id = ?').get(id) as { category_id?: number } | undefined
  const info = db.prepare('DELETE FROM dishes WHERE id = ?').run(id)
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'dish', action: 'delete', id, category_id: current?.category_id }))
  return info.changes
})

// Orders listing for current shift (today, localtime)
ipcMain.handle('get-orders-today', async () => {
  const odb = getOrdersDb();
  const orders = odb.prepare(`
    SELECT 
      o.id,
      o.created_at,
      o.status,
      o.phone_id,
      o.customer_id,
      COALESCE(SUM(oi.quantity * oi.price), 0) AS total
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE date(o.created_at, 'localtime') = date('now', 'localtime')
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all() as Array<{ id:number; created_at:string; status:string; phone_id:number; customer_id:number|null; total:number }>

  const ids = Array.from(new Set(orders.map(o => o.customer_id).filter((v): v is number => typeof v === 'number')))
  const customersById = new Map<number, { id:number; name:string; phone:string }>()
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT id, name, phone FROM customers WHERE id IN (${placeholders})`).all(...ids) as Array<{ id:number; name:string; phone:string }>
    for (const r of rows) customersById.set(r.id, r)
  }

  return orders.map(o => ({
    id: o.id,
    created_at: o.created_at,
    status: o.status,
    phone_id: o.phone_id,
    customer_name: o.customer_id != null ? customersById.get(o.customer_id)?.name : undefined,
    customer_phone: o.customer_id != null ? customersById.get(o.customer_id)?.phone : undefined,
    total: o.total,
  }))
})

// CRUD: Customers & Orders
ipcMain.handle('create-customer-and-order', async (_e, { customer, phoneId }: { customer: { name: string; phone: string; address: string }, phoneId: number }) => {
  return db.transaction(() => {
    // Find or create customer
    let customerRecord = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone) as { id: number } | undefined
    let customerId: number;
    if (customerRecord) {
      customerId = customerRecord.id;
      db.prepare('UPDATE customers SET name = ?, address = ? WHERE id = ?').run(customer.name, customer.address, customerId);
    } else {
      const info = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)').run(customer.name, customer.phone, customer.address);
      customerId = info.lastInsertRowid as number;
    }

    // Create order
    const odb = getOrdersDb();
    const orderInfo = odb.prepare('INSERT INTO orders (customer_id, phone_id) VALUES (?, ?)').run(customerId, phoneId);
    const orderId = orderInfo.lastInsertRowid;

    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'customer', action: 'create', id: customerId }));
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'order', action: 'create', id: orderId }));

    return { customerId, orderId };
  })();
});

// New: create or update a customer only (no order)
ipcMain.handle('create-or-update-customer', async (_e, customer: { name: string; phone: string; address: string }) => {
  return db.transaction(() => {
    let customerRecord = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone) as { id: number } | undefined
    let customerId: number;
    if (customerRecord) {
      customerId = customerRecord.id;
      db.prepare('UPDATE customers SET name = ?, address = ? WHERE id = ?').run(customer.name, customer.address, customerId);
    } else {
      const info = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)').run(customer.name, customer.phone, customer.address);
      customerId = info.lastInsertRowid as number;
    }
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'customer', action: 'create', id: customerId }));
    return { customerId };
  })();
});

// New: create order with items at checkout
ipcMain.handle('create-order-with-items', async (_e, payload: { customerId: number; phoneId: number; items: Array<{ dish_id: number; quantity: number; price: number }> }) => {
  try {
    const odb = getOrdersDb();
    const orderInfo = odb.prepare('INSERT INTO orders (customer_id, phone_id) VALUES (?, ?)').run(payload.customerId, payload.phoneId);
    const orderId = orderInfo.lastInsertRowid as number;
    if (payload.items && payload.items.length > 0) {
      const stmt = odb.prepare('INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES (?, ?, ?, ?)');
      const insertMany = odb.transaction((rows: Array<{ dish_id:number; quantity:number; price:number }>) => {
        for (const it of rows) stmt.run(orderId, it.dish_id, it.quantity, it.price);
      });
      insertMany(payload.items);
    }
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'order', action: 'create', id: orderId }));
    return { orderId };
  } catch (err: any) {
    throw new Error(`CREATE_ORDER_FAILED: ${err?.message || String(err)}`);
  }
});

// Shift controls
ipcMain.handle('start-shift', async () => {
  try {
    const info = startNewShift();
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'shift', action: 'start', id: info.date }));
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    if (win) win.focus()
    return info;
  } catch (err: any) {
    const msg = err?.message || String(err);
    throw new Error(`START_SHIFT_FAILED: ${msg}`);
  }
})

ipcMain.handle('get-current-shift', async () => {
  return getCurrentShift();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(() => {
  initializeDatabase()
  createWindow()
})
