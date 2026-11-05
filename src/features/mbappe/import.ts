import { db } from '../../db/db'
import type { BackupFile } from '../backup/backup'
import { MBAPPE_CATEGORY_PREFIX, MBAPPE_SOURCE, MBAPPE_TX_PREFIX } from './constants'

export function isMbappeFile(backup: BackupFile): boolean {
  return backup.source === MBAPPE_SOURCE
}

export interface MbappeImportResult {
  added: number
  updated: number
  removed: number
}

/**
 * Menerapkan kiriman Markas Mbappe ke Dompetku sebagai cermin kas Mbappe:
 * - pemasukan baru ditambahkan, yang sudah ada diperbarui (ID sama → tidak dobel),
 * - pemasukan Mbappe yang sudah tidak ada di kiriman (dihapus di Markas Mbappe) ikut dihapus,
 * - kategori sumber hanya ditambahkan bila belum ada (perubahan nama/warna di Dompetku dipertahankan),
 * - transaksi lain di Dompetku tidak disentuh.
 */
export async function importFromMbappe(backup: BackupFile): Promise<MbappeImportResult> {
  const incoming = backup.data.transactions.filter((tx) => tx.id.startsWith(MBAPPE_TX_PREFIX) && tx.type === 'income')
  const categories = backup.data.categories.filter((c) => c.id.startsWith(MBAPPE_CATEGORY_PREFIX))

  return db.transaction('rw', db.transactions, db.categories, async () => {
    const existing = await db.transactions.where('id').startsWith(MBAPPE_TX_PREFIX).primaryKeys()
    const existingIds = new Set(existing)
    const incomingIds = new Set(incoming.map((tx) => tx.id))
    const removed = existing.filter((id) => !incomingIds.has(id))

    const existingCategories = new Set(await db.categories.where('id').startsWith(MBAPPE_CATEGORY_PREFIX).primaryKeys())
    const newCategories = categories.filter((c) => !existingCategories.has(c.id))
    if (newCategories.length > 0) await db.categories.bulkPut(newCategories)

    await db.transactions.bulkPut(incoming)
    if (removed.length > 0) await db.transactions.bulkDelete(removed)

    const added = incoming.filter((tx) => !existingIds.has(tx.id)).length
    return { added, updated: incoming.length - added, removed: removed.length }
  })
}
