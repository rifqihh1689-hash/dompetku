/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Nama repo GitHub → path dasar di GitHub Pages (https://<user>.github.io/dompetku/).
// Bisa ditimpa lewat variabel lingkungan BASE_PATH, mis. BASE_PATH=/ untuk domain kustom.
const base = process.env.BASE_PATH ?? '/dompetku/'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Pengguna diberi tahu saat ada versi baru, agar tidak memuat ulang di tengah mengisi form.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-64x64.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: base,
        name: 'Dompetku — Pencatat Keuangan',
        short_name: 'Dompetku',
        description:
          'Catat pemasukan & pengeluaran harian, anggaran, dan transaksi berulang. Bekerja offline, data tersimpan di perangkat.',
        lang: 'id',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#059669',
        background_color: '#f8fafc',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Semua aset aplikasi disimpan di cache agar bisa dibuka tanpa internet.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    alias: {
      // Modul virtual PWA hanya ada saat build; di tes diganti tiruan.
      'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwa-register-mock.ts', import.meta.url)),
    },
  },
})
