import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from '../features/categories/defaults'
import { addCategory, deleteCategory, updateCategory } from '../features/categories/repository'
import { addTransaction, updateTransaction } from '../features/transactions/repository'
import { db } from './db'
import { resetDatabase } from '../test/db-utils'

describe('database', () => {
  beforeEach(resetDatabase)

  it('mengisi kategori bawaan saat pertama dibuat', async () => {
    const categories = await db.categories.toArray()
    expect(categories.map((c) => c.name).sort()).toEqual(
      ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Gaji', 'Lainnya'].sort(),
    )
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length)
  })

  it('menambah & mengubah transaksi dengan validasi', async () => {
    const tx = await addTransaction({ amount: 25000, type: 'expense', categoryId: 'cat-makan', date: '2026-11-03', note: ' Nasi goreng ' })
    expect(tx.note).toBe('Nasi goreng')
    await updateTransaction(tx.id, { ...tx, amount: 30000 })
    expect((await db.transactions.get(tx.id))?.amount).toBe(30000)

    await expect(addTransaction({ amount: 0, type: 'expense', categoryId: 'cat-makan', date: '2026-11-03', note: '' })).rejects.toThrow(
      'Jumlah harus lebih dari 0.',
    )
    await expect(addTransaction({ amount: 100, type: 'expense', categoryId: '', date: '2026-11-03', note: '' })).rejects.toThrow(
      'Pilih kategori',
    )
  })

  it('menolak nama kategori ganda', async () => {
    await expect(addCategory({ name: 'makan', icon: 'coffee', color: '#000000', kind: 'expense' })).rejects.toThrow('sudah ada')
    const c = await addCategory({ name: 'Kopi', icon: 'coffee', color: '#000000', kind: 'expense' })
    await expect(updateCategory(c.id, { name: 'Kopi', icon: 'coffee', color: '#111111', kind: 'expense' })).resolves.toBeUndefined()
  })

  it('memindahkan transaksi ke "Lainnya" saat kategori dihapus', async () => {
    const cat = await addCategory({ name: 'Kopi', icon: 'coffee', color: '#78350f', kind: 'expense' })
    const tx = await addTransaction({ amount: 18000, type: 'expense', categoryId: cat.id, date: '2026-11-03', note: '' })
    await db.budgets.put({ id: `2026-11:${cat.id}`, month: '2026-11', categoryId: cat.id, amount: 100000 })

    await deleteCategory(cat.id)

    expect(await db.categories.get(cat.id)).toBeUndefined()
    expect((await db.transactions.get(tx.id))?.categoryId).toBe(FALLBACK_CATEGORY_ID)
    expect(await db.budgets.count()).toBe(0)
  })

  it('tidak mengizinkan menghapus kategori "Lainnya"', async () => {
    await expect(deleteCategory(FALLBACK_CATEGORY_ID)).rejects.toThrow()
  })
})
