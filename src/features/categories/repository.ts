import { db } from '../../db/db'
import { createId } from '../../lib/id'
import type { Category } from '../../types'
import { FALLBACK_CATEGORY_ID } from './defaults'

export type CategoryInput = Pick<Category, 'name' | 'icon' | 'color' | 'kind'>

export async function validateCategoryInput(input: CategoryInput, excludeId?: string): Promise<string | null> {
  const name = input.name.trim()
  if (!name) return 'Nama kategori wajib diisi.'
  if (name.length > 30) return 'Nama kategori maksimal 30 karakter.'
  const all = await db.categories.toArray()
  const duplicate = all.some((c) => c.id !== excludeId && c.name.toLowerCase() === name.toLowerCase())
  if (duplicate) return `Kategori "${name}" sudah ada.`
  return null
}

export async function addCategory(input: CategoryInput): Promise<Category> {
  const error = await validateCategoryInput(input)
  if (error) throw new Error(error)
  const category: Category = { ...input, name: input.name.trim(), id: createId(), builtIn: false, createdAt: Date.now() }
  await db.categories.add(category)
  return category
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const error = await validateCategoryInput(input, id)
  if (error) throw new Error(error)
  await db.categories.update(id, { ...input, name: input.name.trim() })
}

/**
 * Menghapus kategori. Transaksi & transaksi berulang yang memakai kategori ini
 * dipindahkan ke kategori "Lainnya", dan anggarannya dihapus.
 */
export async function deleteCategory(id: string): Promise<void> {
  if (id === FALLBACK_CATEGORY_ID) throw new Error('Kategori "Lainnya" tidak dapat dihapus.')
  await db.transaction('rw', [db.categories, db.transactions, db.budgets, db.recurring], async () => {
    await db.transactions.where('categoryId').equals(id).modify({ categoryId: FALLBACK_CATEGORY_ID })
    await db.recurring.filter((r) => r.categoryId === id).modify({ categoryId: FALLBACK_CATEGORY_ID })
    await db.budgets.where('categoryId').equals(id).delete()
    await db.categories.delete(id)
  })
}

/** Jumlah transaksi yang memakai kategori. */
export function countCategoryUsage(id: string): Promise<number> {
  return db.transactions.where('categoryId').equals(id).count()
}

/** Apakah kategori bisa dipakai untuk jenis transaksi tertentu. */
export function categoryMatchesType(category: Category, type: 'income' | 'expense'): boolean {
  return category.kind === 'both' || category.kind === type
}
