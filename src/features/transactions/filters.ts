import type { Category, ISODate, MonthKey, Transaction, TransactionType } from '../../types'

export interface TransactionFilter {
  month: MonthKey | 'all'
  categoryId: string | 'all'
  type: TransactionType | 'all'
  query: string
}

export const EMPTY_FILTER: TransactionFilter = { month: 'all', categoryId: 'all', type: 'all', query: '' }

export function isFilterActive(filter: TransactionFilter): boolean {
  return filter.month !== 'all' || filter.categoryId !== 'all' || filter.type !== 'all' || filter.query.trim() !== ''
}

const normalize = (text: string) => text.toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[̀-ͯ]/g, '')

/**
 * Menyaring transaksi berdasarkan bulan, kategori, jenis, dan kata kunci.
 * Kata kunci dicocokkan dengan catatan, nama kategori, dan nominal (mis. "25000" atau "25.000").
 */
export function filterTransactions(
  transactions: readonly Transaction[],
  filter: TransactionFilter,
  getCategory: (id: string) => Category,
): Transaction[] {
  const query = normalize(filter.query.trim())
  const amountQuery = /^[\d.\s]+$/.test(query) ? query.replace(/\D/g, '') : ''

  return transactions.filter((tx) => {
    if (filter.month !== 'all' && !tx.date.startsWith(`${filter.month}-`)) return false
    if (filter.categoryId !== 'all' && tx.categoryId !== filter.categoryId) return false
    if (filter.type !== 'all' && tx.type !== filter.type) return false
    if (!query) return true
    if (amountQuery && String(tx.amount).includes(amountQuery)) return true
    return normalize(tx.note).includes(query) || normalize(getCategory(tx.categoryId).name).includes(query)
  })
}

export interface DateGroup {
  date: ISODate
  transactions: Transaction[]
  income: number
  expense: number
}

/** Mengelompokkan transaksi per tanggal (urutan input dipertahankan). */
export function groupByDate(transactions: readonly Transaction[]): DateGroup[] {
  const groups = new Map<ISODate, DateGroup>()
  for (const tx of transactions) {
    let group = groups.get(tx.date)
    if (!group) {
      group = { date: tx.date, transactions: [], income: 0, expense: 0 }
      groups.set(tx.date, group)
    }
    group.transactions.push(tx)
    group[tx.type] += tx.amount
  }
  return [...groups.values()]
}
