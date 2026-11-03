/**
 * Alamat database Dexie Cloud untuk sinkronisasi antar-perangkat, mis.
 * `https://zabcdefgh.dexie.cloud`. Diambil dari variabel `VITE_DEXIE_CLOUD_URL`
 * (file `.env` atau variabel GitHub Actions). Alamat ini bukan rahasia.
 *
 * Bila kosong, sinkronisasi nonaktif dan aplikasi bekerja sepenuhnya lokal seperti biasa.
 */
export const CLOUD_URL: string = (import.meta.env.VITE_DEXIE_CLOUD_URL ?? '').trim()
