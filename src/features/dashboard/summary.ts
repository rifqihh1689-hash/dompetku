import { daysInMonth } from '../../lib/date'
import type { Category, ISODate, MonthKey, Transaction } from '../../types'

export interface Summary {
  income: number
  expense: number
  /** Pemasukan − pengeluaran. */
  balance: number
  count: number
}

/** Menghitung total pemasukan, pengeluaran, dan saldo. */
export function summarize(transactions: readonly Transaction[]): Summary {
  let income = 0
  let expense = 0
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  }
  return { income, expense, balance: income - expense, count: transactions.length }
}

export interface CategorySlice {
  categoryId: string
  name: string
  icon: string
  color: string
  total: number
  /** Porsi terhadap total pengeluaran (0–1). */
  ratio: number
}

/** Total pengeluaran per kategori, diurutkan dari yang terbesar. */
export function expenseByCategory(transactions: readonly Transaction[], getCategory: (id: string) => Category): CategorySlice[] {
  const totals = new Map<string, number>()
  let grand = 0
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
    grand += tx.amount
  }
  return [...totals.entries()]
    .map(([categoryId, total]) => {
      const c = getCategory(categoryId)
      return { categoryId, name: c.name, icon: c.icon, color: c.color, total, ratio: grand > 0 ? total / grand : 0 }
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

export const OTHER_SLICE_ID = '__lainnya__'

/**
 * Membatasi jumlah potongan grafik lingkaran: kategori kecil digabung menjadi "Kategori lain"
 * agar grafik tetap mudah dibaca.
 */
export function limitSlices(slices: readonly CategorySlice[], max = 6): CategorySlice[] {
  if (slices.length <= max) return [...slices]
  const head = slices.slice(0, max - 1)
  const rest = slices.slice(max - 1)
  const total = rest.reduce((sum, s) => sum + s.total, 0)
  const ratio = rest.reduce((sum, s) => sum + s.ratio, 0)
  return [...head, { categoryId: OTHER_SLICE_ID, name: 'Kategori lain', icon: 'ellipsis', color: '#94a3b8', total, ratio }]
}

export interface DailyPoint {
  day: number
  date: ISODate
  income: number
  expense: number
}

/** Pemasukan & pengeluaran per hari untuk satu bulan penuh (hari tanpa transaksi bernilai 0). */
export function dailyTrend(transactions: readonly Transaction[], month: MonthKey): DailyPoint[] {
  const days = daysInMonth(month)
  const points: DailyPoint[] = Array.from({ length: days }, (_, i) => {
    const day = i + 1
    return { day, date: `${month}-${String(day).padStart(2, '0')}`, income: 0, expense: 0 }
  })
  for (const tx of transactions) {
    if (!tx.date.startsWith(`${month}-`)) continue
    const point = points[Number(tx.date.slice(8, 10)) - 1]
    if (point) point[tx.type] += tx.amount
  }
  return points
}

/** Rata-rata pengeluaran harian; untuk bulan berjalan dihitung sampai hari ini. */
export function averageDailyExpense(points: readonly DailyPoint[], today: ISODate): number {
  const month = points[0]?.date.slice(0, 7)
  if (!month) return 0
  const elapsed = today.startsWith(`${month}-`) ? Number(today.slice(8, 10)) : today < `${month}-01` ? 0 : points.length
  if (elapsed === 0) return 0
  const total = points.slice(0, elapsed).reduce((sum, p) => sum + p.expense, 0)
  return Math.round(total / elapsed)
}
