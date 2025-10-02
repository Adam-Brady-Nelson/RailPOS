import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { initializeDatabase } from './database'
import db from './database'

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
