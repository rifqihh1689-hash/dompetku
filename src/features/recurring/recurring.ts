import { addMonths, compareMonths, dateInMonth, monthOf } from '../../lib/date'
import type { ISODate, MonthKey, RecurringRule, Transaction } from '../../types'

/** Batas pengaman jumlah bulan yang diproses sekali jalan (50 tahun). */
const MAX_MONTHS = 600

export interface Occurrence {
  month: MonthKey
  date: ISODate
}

/** ID transaksi yang dibuat dari aturan berulang — deterministik agar tidak pernah dobel. */
export function recurringTransactionId(ruleId: string, month: MonthKey): string {
  return `rec-${ruleId}-${month}`
}

/** Bulan pertama yang belum dibuat transaksinya. */
function firstPendingMonth(rule: RecurringRule): MonthKey {
  if (!rule.lastGeneratedMonth) return rule.startMonth
  const afterLast = addMonths(rule.lastGeneratedMonth, 1)
  return compareMonths(afterLast, rule.startMonth) > 0 ? afterLast : rule.startMonth
}

/**
 * Daftar kejadian yang sudah jatuh tempo (tanggal ≤ hari ini) dan belum dibuat transaksinya.
 * Mengejar bulan-bulan yang terlewat bila aplikasi lama tidak dibuka.
 */
export function dueOccurrences(rule: RecurringRule, today: ISODate): Occurrence[] {
  if (!rule.active) return []
  const result: Occurrence[] = []
  const lastMonth = rule.endMonth && compareMonths(rule.endMonth, monthOf(today)) < 0 ? rule.endMonth : monthOf(today)
  let month = firstPendingMonth(rule)
  for (let i = 0; i < MAX_MONTHS && compareMonths(month, lastMonth) <= 0; i++) {
    const date = dateInMonth(month, rule.dayOfMonth)
    if (date > today) break
    result.push({ month, date })
    month = addMonths(month, 1)
  }
  return result
}

/** Tanggal kejadian berikutnya yang belum dibuat, atau `null` bila aturan nonaktif/berakhir. */
export function nextOccurrence(rule: RecurringRule, today: ISODate): ISODate | null {
  if (!rule.active) return null
  let month = firstPendingMonth(rule)
  for (let i = 0; i < MAX_MONTHS; i++) {
    if (rule.endMonth && compareMonths(month, rule.endMonth) > 0) return null
    const date = dateInMonth(month, rule.dayOfMonth)
    if (date > today) return date
    month = addMonths(month, 1)
  }
  return null
}

/** Membuat objek transaksi untuk satu kejadian aturan berulang. */
export function buildRecurringTransaction(rule: RecurringRule, occurrence: Occurrence, now: number): Transaction {
  return {
    id: recurringTransactionId(rule.id, occurrence.month),
    amount: rule.amount,
    type: rule.type,
    categoryId: rule.categoryId,
    date: occurrence.date,
    note: rule.note,
    recurringId: rule.id,
    createdAt: now,
    updatedAt: now,
  }
}

/** Total per bulan dari aturan aktif. */
export function monthlyRecurringTotals(rules: readonly RecurringRule[]): { income: number; expense: number } {
  return rules.reduce((acc, r) => (r.active ? { ...acc, [r.type]: acc[r.type] + r.amount } : acc), { income: 0, expense: 0 })
}
