import { db } from '../../db/db'
import { formatRupiah } from '../../lib/format'
import type { Budget, Category, MonthKey } from '../../types'
import { budgetId, budgetLevel, budgetMessage, type BudgetLevel } from './budget'

export async function setBudget(month: MonthKey, categoryId: string, amount: number): Promise<Budget> {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Jumlah anggaran harus lebih dari 0.')
  if (!categoryId) throw new Error('Pilih kategori terlebih dahulu.')
  const budget: Budget = { id: budgetId(month, categoryId), month, categoryId, amount }
  await db.budgets.put(budget)
  return budget
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id)
}

/** Menyalin anggaran dari satu bulan ke bulan lain (anggaran yang sudah ada tidak ditimpa). Mengembalikan jumlah yang disalin. */
export async function copyBudgets(from: MonthKey, to: MonthKey): Promise<number> {
  return db.transaction('rw', db.budgets, async () => {
    const source = await db.budgets.where('month').equals(from).toArray()
    const existing = new Set((await db.budgets.where('month').equals(to).toArray()).map((b) => b.categoryId))
    const copies = source.filter((b) => !existing.has(b.categoryId)).map((b) => ({ ...b, id: budgetId(to, b.categoryId), month: to }))
    await db.budgets.bulkPut(copies)
    return copies.length
  })
}

/**
 * Memeriksa status anggaran sebuah kategori pada bulan tertentu.
 * Mengembalikan pesan peringatan bila pemakaian ≥ 80%, atau `null` bila aman / tidak ada anggaran.
 */
export async function checkBudget(month: MonthKey, category: Category): Promise<{ level: BudgetLevel; message: string } | null> {
  const budget = await db.budgets.get(budgetId(month, category.id))
  if (!budget) return null
  let spent = 0
  await db.transactions
    .where('date')
    .between(`${month}-01`, `${month}-31`, true, true)
    .filter((tx) => tx.type === 'expense' && tx.categoryId === category.id)
    .each((tx) => {
      spent += tx.amount
    })
  const level = budgetLevel(spent, budget.amount)
  if (level === 'safe') return null
  const remaining = budget.amount - spent
  const ratio = spent / budget.amount
  return { level, message: budgetMessage({ level, ratio, remaining, category }, formatRupiah) }
}
