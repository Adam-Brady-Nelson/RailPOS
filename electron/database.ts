import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';

const isDev = process.env.VITE_DEV_SERVER === 'true' || !app.isPackaged
const baseDir = isDev ? process.cwd() : path.dirname(app.getPath('exe'))
export const dbPath = path.join(baseDir, 'railpos.sqlite')
console.log('[DB] Using database at:', dbPath)
const db = new Database(dbPath, { verbose: console.log });

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
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Optionally, show a dialog to the user
  }
};

export default db;
