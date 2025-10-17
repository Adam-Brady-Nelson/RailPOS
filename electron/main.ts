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

// Get single order details (items + customer info)
ipcMain.handle('get-order-details', async (_e, orderId: number) => {
  const odb = getOrdersDb();
  const order = odb.prepare(`
    SELECT id, customer_id, phone_id, status, payment_method, created_at
    FROM orders WHERE id = ?
  `).get(orderId) as { id:number; customer_id:number|null; phone_id:number; status:string; payment_method: string | null; created_at:string } | undefined;
  if (!order) return null;

  const items = odb.prepare(`
    SELECT dish_id, quantity, price
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(orderId) as Array<{ dish_id:number; quantity:number; price:number }>;

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  let customer: { id:number; name:string; phone:string } | null = null;
  if (order.customer_id != null) {
    const row = db.prepare('SELECT id, name, phone FROM customers WHERE id = ?').get(order.customer_id) as { id:number; name:string; phone:string } | undefined
    if (row) customer = row;
  }

  // Enrich dish names from primary DB
  const dishIds = Array.from(new Set(items.map(it => it.dish_id)));
  const names = new Map<number, string>();
  if (dishIds.length > 0) {
    const placeholders = dishIds.map(() => '?').join(',');
    const rows = db.prepare(`SELECT id, name FROM dishes WHERE id IN (${placeholders})`).all(...dishIds) as Array<{ id:number; name:string }>;
    for (const r of rows) names.set(r.id, r.name);
  }

  return {
    order: { id: order.id, status: order.status, phone_id: order.phone_id, payment_method: order.payment_method, created_at: order.created_at },
    customer,
    items: items.map(it => ({ dish_id: it.dish_id, name: names.get(it.dish_id) ?? `Dish #${it.dish_id}` , quantity: it.quantity, price: it.price })),
    subtotal,
  };
})

// Daily totals for current day (local time)
ipcMain.handle('get-daily-totals', async () => {
  const odb = getOrdersDb();
  const row = odb.prepare(`
    SELECT 
      COALESCE(SUM(oi.quantity * oi.price), 0) AS total,
      COUNT(DISTINCT o.id) AS orders
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE date(o.created_at, 'localtime') = date('now', 'localtime')
  `).get() as { total: number | null; orders: number | null } | undefined;
  return { total: Number(row?.total ?? 0), orders: Number(row?.orders ?? 0) };
})

// Update items for an existing order
ipcMain.handle('update-order-items', async (_e, payload: { orderId: number; items: Array<{ dish_id:number; quantity:number; price:number }> }) => {
  const odb = getOrdersDb();
  const exists = odb.prepare('SELECT id FROM orders WHERE id = ?').get(payload.orderId) as { id:number } | undefined;
  if (!exists) throw new Error('ORDER_NOT_FOUND');
  const delStmt = odb.prepare('DELETE FROM order_items WHERE order_id = ?');
  const insStmt = odb.prepare('INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES (?, ?, ?, ?)');
  const tx = odb.transaction((rows: Array<{ dish_id:number; quantity:number; price:number }>) => {
    delStmt.run(payload.orderId);
    for (const it of rows) insStmt.run(payload.orderId, it.dish_id, it.quantity, it.price);
  });
  tx(payload.items ?? []);
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'order', action: 'update', id: payload.orderId }));
  return true;
})

// Search customers by phone substring/prefix
ipcMain.handle('search-customers-by-phone', async (_e, query: string, limit: number = 10) => {
  const q = (query ?? '').trim();
  if (q.length === 0) return [];
  const like = `%${q}%`;
  const rows = db.prepare(`
    SELECT id, name, phone, address
    FROM customers
    WHERE phone LIKE ?
    ORDER BY name ASC
    LIMIT ?
  `).all(like, limit) as Array<{ id:number; name:string; phone:string; address:string }>;
  return rows;
})

// CRUD: Customers & Orders
ipcMain.handle('create-customer-and-order', async (_e, { customer, phoneId }: { customer: { name: string; phone: string; address: string }, phoneId: number }) => {
  return db.transaction(() => {
    // Find or create customer
  const customerRecord = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone) as { id: number } | undefined
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
  const customerRecord = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone) as { id: number } | undefined
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
ipcMain.handle('create-order-with-items', async (_e, payload: { customerId: number; phoneId: number; items: Array<{ dish_id: number; quantity: number; price: number }>, payment_method?: 'cash' | 'card' }) => {
  try {
    const odb = getOrdersDb();
    const orderInfo = odb.prepare('INSERT INTO orders (customer_id, phone_id, payment_method, status) VALUES (?, ?, ?, ?)')
      .run(payload.customerId, payload.phoneId, payload.payment_method ?? null, payload.payment_method ? 'paid' : 'pending');
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`CREATE_ORDER_FAILED: ${msg}`);
  }
});

ipcMain.handle('finalize-payment', async (_e, payload: { orderId: number; payment_method: 'cash' | 'card' }) => {
  const odb = getOrdersDb();
  const info = odb.prepare('UPDATE orders SET payment_method = ?, status = ? WHERE id = ?')
    .run(payload.payment_method, 'paid', payload.orderId);
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'order', action: 'update', id: payload.orderId }));
  return info.changes > 0;
})

ipcMain.handle('get-revenue-breakdown-today', async () => {
  const odb = getOrdersDb();
  const rows = odb.prepare(`
    SELECT o.payment_method AS method, COALESCE(SUM(oi.quantity * oi.price), 0) AS amount
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE date(o.created_at, 'localtime') = date('now', 'localtime')
      AND o.payment_method IN ('cash', 'card')
      AND o.status = 'paid'
    GROUP BY o.payment_method
  `).all() as Array<{ method: 'cash' | 'card'; amount: number }>;
  const result = { cash: 0, card: 0, total: 0 } as { cash: number; card: number; total: number };
  for (const r of rows) { (result as any)[r.method] = r.amount; }
  result.total = result.cash + result.card;
  return result;
})

// Shift controls
ipcMain.handle('start-shift', async () => {
  try {
    const info = startNewShift();
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('data-changed', { entity: 'shift', action: 'start', id: info.date }));
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    if (win) win.focus()
    return info;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
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
