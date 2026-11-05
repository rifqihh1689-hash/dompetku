/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** Versi aplikasi dari package.json (disuntikkan oleh Vite). */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Alamat database Dexie Cloud (opsional) untuk sinkronisasi antar-perangkat. */
  readonly VITE_DEXIE_CLOUD_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
