import { DEFAULT_CATEGORIES, UNKNOWN_CATEGORY } from '../features/categories/defaults'
import type { Category, Transaction } from '../types'

let counter = 0

/** Membuat transaksi untuk tes dengan nilai bawaan yang masuk akal. */
export function makeTx(partial: Partial<Transaction> = {}): Transaction {
  counter += 1
  return {
    id: `tx-${counter}`,
    amount: 10000,
    type: 'expense',
    categoryId: '#cat-makan',
    date: '2026-11-03',
    note: '',
    createdAt: counter,
    updatedAt: counter,
    ...partial,
  }
}

const categoryMap = new Map<string, Category>(DEFAULT_CATEGORIES.map((c) => [c.id, c]))
export const getDefaultCategory = (id: string): Category => categoryMap.get(id) ?? UNKNOWN_CATEGORY
