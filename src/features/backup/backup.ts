import { isValidISODate, isValidMonthKey, todayISO } from '../../lib/date'
import type { Budget, Category, CategoryKind, RecurringRule, Transaction, TransactionType } from '../../types'

export const BACKUP_APP = 'dompetku'
export const BACKUP_VERSION = 1

export interface BackupData {
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  recurring: RecurringRule[]
}

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: BackupData
}

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string }

export function createBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

export function backupFileName(now: Date = new Date()): string {
  return `dompetku-backup-${todayISO(now)}.json`
}

// ---------- Validasi ----------

type Rec = Record<string, unknown>
const isObject = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const isPositiveInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const isType = (v: unknown): v is TransactionType => v === 'income' || v === 'expense'
const isKind = (v: unknown): v is CategoryKind => isType(v) || v === 'both'
const toNumber = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const toNote = (v: unknown) => (typeof v === 'string' ? v : '')

class BackupError extends Error {}

function parseCategory(v: unknown): Category {
  if (!isObject(v)) throw new BackupError('bukan objek')
  if (!isNonEmptyString(v.id)) throw new BackupError('id kosong')
  if (!isNonEmptyString(v.name)) throw new BackupError('nama kosong')
  if (!isKind(v.kind)) throw new BackupError('jenis kategori tidak dikenal')
  return {
    id: v.id,
    name: v.name.trim(),
    icon: isNonEmptyString(v.icon) ? v.icon : 'tag',
    color: typeof v.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(v.color) ? v.color : '#64748b',
    kind: v.kind,
    builtIn: v.builtIn === true,
    createdAt: toNumber(v.createdAt, 0),
  }
}

function parseTransaction(v: unknown): Transaction {
  if (!isObject(v)) throw new BackupError('bukan objek')
  if (!isNonEmptyString(v.id)) throw new BackupError('id kosong')
  if (!isPositiveInt(v.amount)) throw new BackupError('jumlah harus bilangan bulat positif')
  if (!isType(v.type)) throw new BackupError('jenis harus "income" atau "expense"')
  if (!isNonEmptyString(v.categoryId)) throw new BackupError('kategori kosong')
  if (!isValidISODate(v.date)) throw new BackupError('tanggal tidak valid')
  const tx: Transaction = {
    id: v.id,
    amount: v.amount,
    type: v.type,
    categoryId: v.categoryId,
    date: v.date,
    note: toNote(v.note),
    createdAt: toNumber(v.createdAt, 0),
    updatedAt: toNumber(v.updatedAt, toNumber(v.createdAt, 0)),
  }
  if (isNonEmptyString(v.recurringId)) tx.recurringId = v.recurringId
  return tx
}

function parseBudget(v: unknown): Budget {
  if (!isObject(v)) throw new BackupError('bukan objek')
  if (!isValidMonthKey(v.month)) throw new BackupError('bulan tidak valid')
  if (!isNonEmptyString(v.categoryId)) throw new BackupError('kategori kosong')
  if (!isPositiveInt(v.amount)) throw new BackupError('jumlah harus bilangan bulat positif')
  // ID selalu dibentuk ulang agar aturan "satu anggaran per kategori per bulan" terjaga.
  return { id: `${v.month}:${v.categoryId}`, month: v.month, categoryId: v.categoryId, amount: v.amount }
}

function parseRecurring(v: unknown): RecurringRule {
  if (!isObject(v)) throw new BackupError('bukan objek')
  if (!isNonEmptyString(v.id)) throw new BackupError('id kosong')
  if (!isPositiveInt(v.amount)) throw new BackupError('jumlah harus bilangan bulat positif')
  if (!isType(v.type)) throw new BackupError('jenis harus "income" atau "expense"')
  if (!isNonEmptyString(v.categoryId)) throw new BackupError('kategori kosong')
  if (!isPositiveInt(v.dayOfMonth) || v.dayOfMonth > 31) throw new BackupError('tanggal harus 1–31')
  if (!isValidMonthKey(v.startMonth)) throw new BackupError('bulan mulai tidak valid')
  if (v.endMonth !== undefined && v.endMonth !== null && !isValidMonthKey(v.endMonth)) throw new BackupError('bulan berakhir tidak valid')
  if (v.lastGeneratedMonth !== undefined && v.lastGeneratedMonth !== null && !isValidMonthKey(v.lastGeneratedMonth))
    throw new BackupError('bulan terakhir dibuat tidak valid')
  const rule: RecurringRule = {
    id: v.id,
    amount: v.amount,
    type: v.type,
    categoryId: v.categoryId,
    note: toNote(v.note),
    dayOfMonth: v.dayOfMonth,
    startMonth: v.startMonth,
    active: v.active !== false,
    createdAt: toNumber(v.createdAt, 0),
  }
  if (isValidMonthKey(v.endMonth)) rule.endMonth = v.endMonth
  if (isValidMonthKey(v.lastGeneratedMonth)) rule.lastGeneratedMonth = v.lastGeneratedMonth
  return rule
}

function parseList<T>(value: unknown, label: string, parse: (v: unknown) => T): T[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new BackupError(`Bagian "${label}" harus berupa daftar.`)
  return value.map((item, index) => {
    try {
      return parse(item)
    } catch (e) {
      throw new BackupError(`${label} ke-${index + 1} tidak valid: ${(e as Error).message}.`)
    }
  })
}

/** Membaca & memvalidasi isi file backup JSON. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' }
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP || !isObject(raw.data)) {
    return { ok: false, error: 'File ini bukan backup Dompetku.' }
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'Versi backup tidak didukung. Perbarui aplikasi terlebih dahulu.' }
  }
  try {
    const data: BackupData = {
      categories: parseList(raw.data.categories, 'Kategori', parseCategory),
      transactions: parseList(raw.data.transactions, 'Transaksi', parseTransaction),
      budgets: parseList(raw.data.budgets, 'Anggaran', parseBudget),
      recurring: parseList(raw.data.recurring, 'Transaksi berulang', parseRecurring),
    }
    return {
      ok: true,
      backup: { app: BACKUP_APP, version: raw.version, exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '', data },
    }
  } catch (e) {
    return { ok: false, error: e instanceof BackupError ? e.message : 'File backup rusak.' }
  }
}

// ---------- CSV ----------

export type CsvDelimiter = ';' | ','

/** Penanda UTF-8 agar Excel membaca huruf non-ASCII dengan benar. */
export const CSV_BOM = '﻿'

/** Mencegah "CSV injection": teks yang diawali =, +, -, @ dianggap rumus oleh Excel. */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

export function escapeCsvField(value: string, delimiter: CsvDelimiter): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Mengubah transaksi menjadi CSV (urut tanggal lama → baru).
 * Kolom: Tanggal; Jenis; Kategori; Jumlah; Catatan. Jumlah ditulis sebagai angka polos agar bisa dihitung di Excel.
 */
export function transactionsToCsv(
  transactions: readonly Transaction[],
  getCategoryName: (id: string) => string,
  delimiter: CsvDelimiter = ';',
): string {
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Catatan']
  const rows = [...transactions]
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((tx) => [
      tx.date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      neutralizeFormula(getCategoryName(tx.categoryId)),
      String(tx.amount),
      neutralizeFormula(tx.note),
    ])
  return [header, ...rows].map((row) => row.map((field) => escapeCsvField(field, delimiter)).join(delimiter)).join('\r\n')
}

export function csvFileName(month: string | null, now: Date = new Date()): string {
  return month ? `dompetku-transaksi-${month}.csv` : `dompetku-transaksi-${todayISO(now)}.csv`
}
