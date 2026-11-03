/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Nama repo GitHub → path dasar di GitHub Pages (https://<user>.github.io/dompetku/).
// Bisa ditimpa lewat variabel lingkungan BASE_PATH, mis. BASE_PATH=/ untuk domain kustom.
const base = process.env.BASE_PATH ?? '/dompetku/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
