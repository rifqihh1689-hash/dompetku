import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES } from '../features/categories/defaults'
import { mergeCategories } from '../features/categories/merge'
import { createDatabase } from './db'

const NAME = 'dompetku-migrasi-tes'

/** Membuat database persis seperti versi 1.0 (sebelum sinkronisasi). */
async function createLegacyV1Database() {
  const old = new Dexie(NAME)
  old.version(1).stores({
    transactions: 'id, date, type, categoryId, recurringId',
    categories: 'id, name',
    budgets: 'id, month, categoryId',
    recurring: 'id, active',
  })
  await old.open()
  const legacyDefaults = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.id.slice(1) }))
  legacyDefaults[0] = { ...legacyDefaults[0], name: 'Makanan' } // diubah pengguna
  await old.table('categories').bulkAdd([
    ...legacyDefaults.filter((c) => c.id !== 'cat-hiburan'), // "Hiburan" dihapus pengguna
    { id: 'uuid-kopi', name: 'Kopi', icon: 'coffee', color: '#000000', kind: 'expense', builtIn: false, createdAt: 99 },
  ])
  await old.table('transactions').bulkAdd([
    { id: 't1', amount: 25000, type: 'expense', categoryId: 'cat-makan', date: '2026-11-03', note: '', createdAt: 1, updatedAt: 1 },
    { id: 't2', amount: 18000, type: 'expense', categoryId: 'uuid-kopi', date: '2026-11-03', note: '', createdAt: 2, updatedAt: 2 },
  ])
  await old.table('budgets').add({ id: '2026-11:cat-makan', month: '2026-11', categoryId: 'cat-makan', amount: 500000 })
  await old.table('recurring').add({
    id: 'r1',
    amount: 350000,
    type: 'expense',
    categoryId: 'cat-tagihan',
    note: 'Listrik',
    dayOfMonth: 5,
    startMonth: '2026-11',
    active: true,
    createdAt: 0,
  })
  old.close()
}

describe('migrasi database v1 → v2', () => {
  afterEach(async () => {
    await Dexie.delete(NAME)
  })

  it('memetakan ID lama dan mempertahankan perubahan pengguna', async () => {
    await createLegacyV1Database()
    const db = createDatabase(NAME, '')
    await db.open()

    expect((await db.transactions.get('t1'))?.categoryId).toBe('#cat-makan')
    expect((await db.transactions.get('t2'))?.categoryId).toBe('uuid-kopi')
    expect(await db.budgets.toArray()).toEqual([{ id: '#2026-11:#cat-makan', month: '2026-11', categoryId: '#cat-makan', amount: 500000 }])
    expect((await db.recurring.get('r1'))?.categoryId).toBe('#cat-tagihan')

    const names = mergeCategories(await db.categories.toArray()).map((c) => c.name)
    expect(names).toEqual(['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Gaji', 'Lainnya', 'Kopi'])
    // Hanya perubahan yang disimpan: Makan (diubah), Hiburan (dihapus), Kopi (kustom).
    expect((await db.categories.toArray()).map((c) => c.id).sort()).toEqual(['#cat-hiburan', '#cat-makan', 'uuid-kopi'])
    db.close()
  })
})
