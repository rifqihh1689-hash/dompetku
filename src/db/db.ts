import Dexie, { type EntityTable } from 'dexie'
import type { Budget, Category, RecurringRule, Transaction } from '../types'
import { CLOUD_URL } from './cloud-config'
import { upgradeToV2 } from './migrations'

export type DompetkuDB = Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: EntityTable<Budget, 'id'>
  recurring: EntityTable<RecurringRule, 'id'>
}

export const DB_NAME = 'dompetku'

// Add-on sinkronisasi hanya diunduh bila sinkronisasi dikonfigurasi (memisahkan ~240 KB dari bundel utama).
const dexieCloud = CLOUD_URL ? (await import('dexie-cloud-addon')).default : null

const STORES = {
  transactions: 'id, date, type, categoryId, recurringId',
  categories: 'id, name',
  budgets: 'id, month, categoryId',
  recurring: 'id, active',
}

/**
 * Membuat database. Bila `cloudUrl` diisi, add-on Dexie Cloud diaktifkan untuk
 * sinkronisasi antar-perangkat (login opsional; tanpa login data tetap lokal).
 */
export function createDatabase(name: string = DB_NAME, cloudUrl: string = CLOUD_URL, cloudAddon = dexieCloud): DompetkuDB {
  const useCloud = Boolean(cloudUrl && cloudAddon)
  const db = new Dexie(name, { addons: useCloud && cloudAddon ? [cloudAddon] : [] }) as DompetkuDB

  db.version(1).stores(STORES)
  db.version(2).stores(STORES).upgrade(upgradeToV2)

  if (useCloud) {
    db.cloud.configure({
      databaseUrl: cloudUrl,
      // Aplikasi tetap bisa dipakai tanpa login; login hanya untuk sinkronisasi.
      requireAuth: false,
      // Tampilan login dibuat sendiri agar berbahasa Indonesia.
      customLoginGui: true,
      // Login cukup dengan kode yang dikirim ke email.
      socialAuth: false,
      // PENTING: tetap pakai database lokal "dompetku" yang sudah ada. Bawaan add-on
      // menambahkan akhiran nama (mis. "dompetku-zxxxx") sehingga data lama tidak terbaca.
      nameSuffix: false,
    })
  }

  return db
}

/** Instans database utama aplikasi (IndexedDB di perangkat). */
export const db = createDatabase()

/** Apakah sinkronisasi antar-perangkat tersedia di build ini. */
export const cloudEnabled = CLOUD_URL !== ''
