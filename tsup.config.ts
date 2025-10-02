import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    main: 'electron/main.ts',
    preload: 'electron/preload.ts',
  },
  outDir: 'dist-electron',
  // Use CommonJS for Electron main/preload to avoid dynamic require issues
  format: ['cjs'],
  outExtension() {
    return { js: '.cjs' }
  },
  sourcemap: true,
  minify: false,
  clean: true,
  splitting: false,
  bundle: true, // bundle app code, but keep Electron/native deps external
  external: ['electron', 'better-sqlite3'],
  platform: 'node',
  target: 'node18',
  shims: false,
  dts: false,
  tsconfig: 'tsconfig.electron.json',
})
