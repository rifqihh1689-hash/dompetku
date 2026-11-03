import type { ISODate, MonthKey } from '../types'

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

const pad = (n: number) => n.toString().padStart(2, '0')

/** Tanggal lokal dari objek Date → `YYYY-MM-DD`. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Tanggal hari ini (zona waktu lokal). */
export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now)
}

/** `YYYY-MM-DD` → objek Date lokal (tengah malam). */
export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(`${y}-${pad(m)}`)
}

export function isValidMonthKey(value: unknown): value is MonthKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return false
  const m = Number(value.slice(5, 7))
  return m >= 1 && m <= 12
}

/** Kunci bulan dari tanggal: `2026-11-03` → `2026-11`. */
export function monthOf(date: ISODate): MonthKey {
  return date.slice(0, 7)
}

export function currentMonth(now: Date = new Date()): MonthKey {
  return monthOf(todayISO(now))
}

/** Jumlah hari dalam bulan. */
export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Menggeser bulan: addMonths('2026-12', 1) → '2027-01'. */
export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

/** Membandingkan dua kunci bulan (format tetap, jadi cukup perbandingan string). */
export function compareMonths(a: MonthKey, b: MonthKey): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Tanggal di bulan tertentu, hari disesuaikan ke akhir bulan bila perlu (31 Feb → 28/29 Feb). */
export function dateInMonth(month: MonthKey, day: number): ISODate {
  const clamped = Math.min(Math.max(1, Math.floor(day)), daysInMonth(month))
  return `${month}-${pad(clamped)}`
}

/** `2026-11` → "November 2026". */
export function formatMonthLabel(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/** `2026-11-03` → "3 November 2026". */
export function formatDateLabel(date: ISODate): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`
}

/** `2026-11-03` → "Selasa, 3 November 2026". */
export function formatDateLong(date: ISODate): string {
  return `${DAY_NAMES[parseISODate(date).getDay()]}, ${formatDateLabel(date)}`
}

/** `2026-11-03` → "3 Nov". */
export function formatDateShort(date: ISODate): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)}`
}
