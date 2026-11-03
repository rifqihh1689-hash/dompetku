import { db } from '../../db/db'
import { createBackup, type BackupData, type BackupFile } from './backup'

export type ImportMode = 'replace' | 'merge'

const TABLES = () => [db.categories, db.transactions, db.budgets, db.recurring]

/** Properti tambahan dari sinkronisasi (Dexie Cloud) yang tidak perlu ikut di file backup. */
const SYNC_PROPS = ['owner', 'realmId', '$ts'] as const

function stripSyncProps<T extends object>(rows: T[]): T[] {
  return rows.map((row) => {
    const copy = { ...row } as Record<string, unknown>
    for (const prop of SYNC_PROPS) delete copy[prop]
    return copy as T
  })
}

export async function exportBackup(now: Date = new Date()): Promise<BackupFile> {
  return db.transaction('r', TABLES(), async () => {
    const data: BackupData = {
      categories: stripSyncProps(await db.categories.toArray()),
      transactions: stripSyncProps(await db.transactions.orderBy('date').toArray()),
      budgets: stripSyncProps(await db.budgets.toArray()),
      recurring: stripSyncProps(await db.recurring.toArray()),
    }
    return createBackup(data, now)
  })
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
  })
}

/** Menghapus seluruh data (kategori bawaan kembali ke kondisi awal). */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', TABLES(), async () => {
    await Promise.all(TABLES().map((table) => table.clear()))
  })
}
