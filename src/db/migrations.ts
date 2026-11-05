import type { Transaction as DexieTransaction } from 'dexie'
import { budgetId } from '../features/budget/budget'
import { migrateLegacyCategoryId } from '../features/categories/defaults'
import { normalizeCategoryRows } from '../features/categories/merge'
import type { Budget, Category, RecurringRule, Transaction } from '../types'

/**
 * Migrasi v1 → v2 (persiapan sinkronisasi):
 * - ID kategori bawaan "cat-…" → "#cat-…" (termasuk referensinya di transaksi, anggaran, berulang)
 * - ID anggaran "bulan:kategori" → "#bulan:kategori"
 * - kategori bawaan yang tidak diubah tidak lagi disimpan di database
 */
export async function upgradeToV2(tx: DexieTransaction): Promise<void> {
  await tx
    .table<Transaction>('transactions')
    .toCollection()
    .modify((t) => {
      t.categoryId = migrateLegacyCategoryId(t.categoryId)
    })
  await tx
    .table<RecurringRule>('recurring')
    .toCollection()
    .modify((r) => {
      r.categoryId = migrateLegacyCategoryId(r.categoryId)
    })

  const budgets = await tx.table<Budget>('budgets').toArray()
  await tx.table('budgets').clear()
  await tx.table<Budget>('budgets').bulkPut(
    budgets.map((b) => {
      const categoryId = migrateLegacyCategoryId(b.categoryId)
      return { ...b, categoryId, id: budgetId(b.month, categoryId) }
    }),
  )

  const categories = await tx.table<Category>('categories').toArray()
  await tx.table('categories').clear()
  await tx.table<Category>('categories').bulkPut(normalizeCategoryRows(categories))
}
