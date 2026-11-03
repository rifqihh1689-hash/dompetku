import { db } from '../../db/db'
import { isValidISODate } from '../../lib/date'
import { createId } from '../../lib/id'
import type { Transaction, TransactionInput } from '../../types'

/** Memvalidasi input transaksi. Mengembalikan pesan galat (Bahasa Indonesia) atau `null` bila valid. */
export function validateTransactionInput(input: TransactionInput): string | null {
  if (!Number.isInteger(input.amount) || input.amount <= 0) return 'Jumlah harus lebih dari 0.'
  if (input.type !== 'income' && input.type !== 'expense') return 'Jenis transaksi tidak valid.'
  if (!input.categoryId) return 'Pilih kategori terlebih dahulu.'
  if (!isValidISODate(input.date)) return 'Tanggal tidak valid.'
  return null
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
  const error = validateTransactionInput(input)
  if (error) throw new Error(error)
  const now = Date.now()
  const tx: Transaction = { ...input, note: input.note.trim(), id: createId(), createdAt: now, updatedAt: now }
  await db.transactions.add(tx)
  return tx
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const error = validateTransactionInput(input)
  if (error) throw new Error(error)
  const updated = await db.transactions.update(id, { ...input, note: input.note.trim(), updatedAt: Date.now() })
  if (updated === 0) throw new Error('Transaksi tidak ditemukan.')
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}
