export function closeCurrentShift() {
  if (ordersDb) {
    try { ordersDb.close(); } catch {}
    ordersDb = null;
  }
  if (fs.existsSync(currentShiftFile)) fs.unlinkSync(currentShiftFile);
  console.log('[DB] Closed current shift.');
}
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';

const isDev = process.env.VITE_DEV_SERVER === 'true' || !app.isPackaged
const baseDir = isDev ? process.cwd() : path.dirname(app.getPath('exe'))
export const dbPath = path.join(baseDir, 'railpos.sqlite')
console.log('[DB] Using database at:', dbPath)
const db = new Database(dbPath, { verbose: console.log });

// Per-shift orders database handling
const shiftsDir = path.join(baseDir, 'shifts');
const currentShiftFile = path.join(shiftsDir, 'current-shift.json');
let ordersDb: any | null = null;

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
  if (ordersDb) try { ordersDb.close(); } catch {}
  ordersDb = odb;
  const info: ShiftInfo = { path: file, date };
  writeCurrentShift(info);
  console.log('[DB] Started new shift with orders DB:', file);
  return info;
}

export function getOrdersDb(): any {
  if (ordersDb) return ordersDb;
  const info = getCurrentShift();
  if (!info) throw new Error('NO_ACTIVE_SHIFT');
  ordersDb = new Database(info.path, { verbose: console.log });
  return ordersDb;
}

export const initializeDatabase = () => {
  try {
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

    const hasDishesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dishes'").get();
    if (!hasDishesTable) {
      db.exec(`
        CREATE TABLE dishes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          category_id INTEGER,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );
      `);
      // Seed with default data
      const insertDish = db.prepare('INSERT INTO dishes (name, price, category_id) VALUES (?, ?, ?)');
      const insertManyDishes = db.transaction((dishes) => {
        for (const dish of dishes) insertDish.run(dish.name, dish.price, dish.category_id);
      });
      insertManyDishes([
        { name: 'Spring Rolls', price: 5.99, category_id: 1 },
        { name: 'Chicken Curry', price: 12.99, category_id: 2 },
        { name: 'Cheesecake', price: 6.99, category_id: 3 },
        { name: 'Coke', price: 2.50, category_id: 4 },
      ]);
    }

    const hasCustomersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get();
    if (!hasCustomersTable) {
      db.exec(`
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

export default db;
