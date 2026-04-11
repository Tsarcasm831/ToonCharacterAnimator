import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
})
