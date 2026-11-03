import { db } from '../../db/db'
import { isValidMonthKey, todayISO } from '../../lib/date'
import { createId } from '../../lib/id'
import type { ISODate, RecurringRule } from '../../types'
import { buildRecurringTransaction, dueOccurrences } from './recurring'

export type RecurringInput = Pick<RecurringRule, 'amount' | 'type' | 'categoryId' | 'note' | 'dayOfMonth' | 'startMonth' | 'endMonth'>

export function validateRecurringInput(input: RecurringInput): string | null {
  if (!Number.isInteger(input.amount) || input.amount <= 0) return 'Jumlah harus lebih dari 0.'
  if (!input.categoryId) return 'Pilih kategori terlebih dahulu.'
  if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 31) return 'Tanggal harus antara 1 dan 31.'
  if (!isValidMonthKey(input.startMonth)) return 'Bulan mulai tidak valid.'
  if (input.endMonth !== undefined) {
    if (!isValidMonthKey(input.endMonth)) return 'Bulan berakhir tidak valid.'
    if (input.endMonth < input.startMonth) return 'Bulan berakhir tidak boleh sebelum bulan mulai.'
  }
  return null
}

export async function addRecurringRule(input: RecurringInput): Promise<RecurringRule> {
  const error = validateRecurringInput(input)
  if (error) throw new Error(error)
  const rule: RecurringRule = { ...input, note: input.note.trim(), id: createId(), active: true, createdAt: Date.now() }
  await db.recurring.add(rule)
  return rule
}

export async function updateRecurringRule(id: string, input: RecurringInput): Promise<void> {
  const error = validateRecurringInput(input)
  if (error) throw new Error(error)
  // `endMonth: undefined` harus benar-benar menghapus nilai lama.
  await db.recurring.update(id, { ...input, note: input.note.trim(), endMonth: input.endMonth })
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  await db.recurring.update(id, { active })
}

/** Menghapus aturan. Transaksi yang sudah dibuat tetap tersimpan di riwayat. */
export async function deleteRecurringRule(id: string): Promise<void> {
  await db.recurring.delete(id)
}

/**
 * Membuat transaksi untuk semua aturan berulang yang sudah jatuh tempo.
 * Aman dipanggil berkali-kali (idempoten): setiap kejadian hanya dibuat sekali.
 * Mengembalikan jumlah transaksi yang ditambahkan.
 */
export async function generateRecurringTransactions(today: ISODate = todayISO()): Promise<number> {
  return db.transaction('rw', db.recurring, db.transactions, async () => {
    const rules = await db.recurring.toArray()
    const now = Date.now()
    let added = 0
    for (const rule of rules) {
      const occurrences = dueOccurrences(rule, today)
      if (occurrences.length === 0) continue
      for (const occurrence of occurrences) {
        const tx = buildRecurringTransaction(rule, occurrence, now)
        if (await db.transactions.get(tx.id)) continue
        await db.transactions.add(tx)
        added++
      }
      await db.recurring.update(rule.id, { lastGeneratedMonth: occurrences[occurrences.length - 1].month })
    }
    return added
  })
}
