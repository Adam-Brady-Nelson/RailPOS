export function closeCurrentShift() {
  if (ordersDb) {
    try { ordersDb.close(); } catch (e) {
      console.warn('[DB] Error closing ordersDb:', e);
    }
    ordersDb = null;
  }
  if (fs.existsSync(currentShiftFile)) fs.unlinkSync(currentShiftFile);
  console.log('[DB] Closed current shift.');
}
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';
type BetterSqlite3Database = InstanceType<typeof Database>;

const isDev = process.env.VITE_DEV_SERVER === 'true' || !app.isPackaged
// In production (packaged), write to a user-writable location
// AppImage/exe directories can be read-only; app.getPath('userData') is correct
const baseDir = isDev ? process.cwd() : app.getPath('userData')
// Ensure base directory exists when packaged
if (!isDev) {
  try { fs.mkdirSync(baseDir, { recursive: true }); } catch { /* best-effort ensure userData exists */ }
}
export const dbPath = path.join(baseDir, 'railpos.sqlite')
console.log('[DB] Primary DB path will be:', dbPath)

let primaryDb: BetterSqlite3Database | null = null;

export function databaseExists(): boolean {
  try {
    return fs.existsSync(dbPath);
  } catch {
    return false;
  }
}

export function getDb(): BetterSqlite3Database {
  if (!primaryDb) {
    primaryDb = new Database(dbPath, { verbose: console.log });
  }
  return primaryDb;
}

// Per-shift orders database handling
const shiftsDir = path.join(baseDir, 'shifts');
const currentShiftFile = path.join(shiftsDir, 'current-shift.json');
let ordersDb: BetterSqlite3Database | null = null;

export type ShiftInfo = { path: string; date: string };

export function getCurrentShift(): ShiftInfo | null {
  try {
    if (!fs.existsSync(currentShiftFile)) return null;
    const raw = fs.readFileSync(currentShiftFile, 'utf-8');
    const info = JSON.parse(raw) as ShiftInfo;
    return info;
  } catch (e) {
    console.error('[DB] Failed reading current shift file:', e);
    return null;
  }
}

function writeCurrentShift(info: ShiftInfo) {
  fs.mkdirSync(shiftsDir, { recursive: true });
  fs.writeFileSync(currentShiftFile, JSON.stringify(info, null, 2));
}

export function startNewShift(): ShiftInfo {
  fs.mkdirSync(shiftsDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD local-ish
  const file = path.join(shiftsDir, `orders-${date}.sqlite`);
  // Initialize the orders DB and tables
  const odb = new Database(file, { verbose: console.log });
  odb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      phone_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      fulfillment TEXT NOT NULL CHECK (fulfillment IN ('delivery','collection')) DEFAULT 'collection',
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL
    );
  `);
  // swap live ordersDb
  if (ordersDb) try { ordersDb.close(); } catch (e) { console.warn('[DB] Error closing previous ordersDb:', e); }
  ordersDb = odb;
  const info: ShiftInfo = { path: file, date };
  writeCurrentShift(info);
  console.log('[DB] Started new shift with orders DB:', file);
  return info;
}

export function getOrdersDb(): BetterSqlite3Database {
  if (ordersDb) return ordersDb;
  const info = getCurrentShift();
  if (!info) throw new Error('NO_ACTIVE_SHIFT');
  ordersDb = new Database(info.path, { verbose: console.log });
  // Ensure schema migrations for existing shift DBs
  try {
    const cols = ordersDb.prepare("PRAGMA table_info('orders')").all() as Array<{ name: string }>
    const hasPaymentMethod = cols.some(c => c.name === 'payment_method');
    const hasFulfillment = cols.some(c => c.name === 'fulfillment');
    const hasTableId = cols.some(c => c.name === 'table_id');
    if (!hasPaymentMethod) {
      ordersDb.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT");
    }
    if (!hasFulfillment) {
      ordersDb.exec("ALTER TABLE orders ADD COLUMN fulfillment TEXT NOT NULL DEFAULT 'collection'");
    }
    if (!hasTableId) {
      ordersDb.exec("ALTER TABLE orders ADD COLUMN table_id INTEGER");
    }
  } catch (e) {
    console.warn('[DB] Orders schema migration check failed:', e);
  }
  return ordersDb;
}

export const initializeDatabase = () => {
  try {
    const db = getDb();
    const hasCategoriesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
    if (!hasCategoriesTable) {
      db.exec(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );
      `);
      // Seed with default data
      const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
      const insertManyCategories = db.transaction((cats) => {
        for (const cat of cats) insertCategory.run(cat.name);
      });
      insertManyCategories([
        { name: 'Starters' },
        { name: 'Mains' },
        { name: 'Desserts' },
        { name: 'Drinks' },
      ]);
    }

    const hasDishesTable = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dishes'").get();
    if (!hasDishesTable) {
      getDb().exec(`
        CREATE TABLE dishes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          category_id INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );
      `);
      // Seed with default data
      const insertDish = getDb().prepare('INSERT INTO dishes (name, price, category_id) VALUES (?, ?, ?)');
      const insertManyDishes = getDb().transaction((dishes) => {
        for (const dish of dishes) insertDish.run(dish.name, dish.price, dish.category_id);
      });
      insertManyDishes([
        { name: 'Spring Rolls', price: 5.99, category_id: 1 },
        { name: 'Chicken Curry', price: 12.99, category_id: 2 },
        { name: 'Cheesecake', price: 6.99, category_id: 3 },
        { name: 'Coke', price: 2.50, category_id: 4 },
      ]);
    }

    const hasCustomersTable = getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get();
    if (!hasCustomersTable) {
      getDb().exec(`
        CREATE TABLE customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT
        );
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Optionally, show a dialog to the user
  }
};

// No default export to avoid eager DB creation on module import.
