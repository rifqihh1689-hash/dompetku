import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { UNKNOWN_CATEGORY } from '../features/categories/defaults'
import type { Category, MonthKey, Transaction } from '../types'
import { db } from './db'

/** Semua kategori, diurutkan sesuai waktu dibuat. `undefined` selama memuat. */
export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => db.categories.orderBy('id').toArray().then(sortCategories), [])
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name))
}

/** Peta ID → kategori, dengan fallback "Tanpa kategori". */
export function useCategoryLookup(): (id: string) => Category {
  const categories = useCategories()
  return useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.id, c]))
    return (id: string) => map.get(id) ?? UNKNOWN_CATEGORY
  }, [categories])
}

/** Transaksi pada bulan tertentu (atau semua bila `month` null), terbaru di atas. */
export function useTransactions(month: MonthKey | null): Transaction[] | undefined {
  return useLiveQuery(async () => {
    const collection = month
      ? db.transactions.where('date').between(`${month}-01`, `${month}-31`, true, true)
      : db.transactions.toCollection()
    const list = await collection.toArray()
    return sortTransactions(list)
  }, [month])
}

/** Urutkan transaksi terbaru di atas (tanggal, lalu waktu dibuat). */
export function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
}
