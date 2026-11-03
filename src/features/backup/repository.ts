import { db } from '../../db/db'
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from '../categories/defaults'
import { createBackup, type BackupData, type BackupFile } from './backup'

export type ImportMode = 'replace' | 'merge'

const TABLES = () => [db.categories, db.transactions, db.budgets, db.recurring]

export async function exportBackup(now: Date = new Date()): Promise<BackupFile> {
  return db.transaction('r', TABLES(), async () => {
    const data: BackupData = {
      categories: await db.categories.toArray(),
      transactions: await db.transactions.orderBy('date').toArray(),
      budgets: await db.budgets.toArray(),
      recurring: await db.recurring.toArray(),
    }
    return createBackup(data, now)
  })
}

/** Memastikan kategori cadangan "Lainnya" selalu ada. */
async function ensureFallbackCategory(): Promise<void> {
  if (!(await db.categories.get(FALLBACK_CATEGORY_ID))) {
    const fallback = DEFAULT_CATEGORIES.find((c) => c.id === FALLBACK_CATEGORY_ID)
    if (fallback) await db.categories.add({ ...fallback })
  }
}

/**
 * Memulihkan data dari backup.
 * - `replace`: hapus semua data lalu isi dengan backup.
 * - `merge`: tambahkan/timpa data dengan ID yang sama, data lain tetap.
 */
export async function importBackup(backup: BackupFile, mode: ImportMode): Promise<void> {
  const { categories, transactions, budgets, recurring } = backup.data
  await db.transaction('rw', TABLES(), async () => {
    if (mode === 'replace') {
      await Promise.all(TABLES().map((table) => table.clear()))
    }
    await db.categories.bulkPut(categories)
    await db.transactions.bulkPut(transactions)
    await db.budgets.bulkPut(budgets)
    await db.recurring.bulkPut(recurring)
    await ensureFallbackCategory()
  })
}

/** Menghapus seluruh data dan mengembalikan kategori bawaan. */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', TABLES(), async () => {
    await Promise.all(TABLES().map((table) => table.clear()))
    await db.categories.bulkAdd(DEFAULT_CATEGORIES.map((c) => ({ ...c })))
  })
}
