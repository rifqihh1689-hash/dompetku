import { describe, expect, it } from 'vitest'
import {
  addMonths,
  dateInMonth,
  daysInMonth,
  formatDateLong,
  formatMonthLabel,
  isValidISODate,
  isValidMonthKey,
  monthOf,
  todayISO,
} from './date'

describe('date helpers', () => {
  it('menghitung jumlah hari dalam bulan, termasuk tahun kabisat', () => {
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-11')).toBe(30)
    expect(daysInMonth('2026-12')).toBe(31)
  })

  it('menggeser bulan melewati batas tahun', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-05', 14)).toBe('2027-07')
  })

  it('menyesuaikan tanggal ke akhir bulan', () => {
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28')
    expect(dateInMonth('2026-04', 31)).toBe('2026-04-30')
    expect(dateInMonth('2026-11', 5)).toBe('2026-11-05')
  })

  it('memvalidasi format tanggal & bulan', () => {
    expect(isValidISODate('2026-11-03')).toBe(true)
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('03-11-2026')).toBe(false)
    expect(isValidISODate(123)).toBe(false)
    expect(isValidMonthKey('2026-11')).toBe(true)
    expect(isValidMonthKey('2026-00')).toBe(false)
  })

  it('memakai tanggal lokal', () => {
    expect(todayISO(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03')
    expect(monthOf('2026-11-03')).toBe('2026-11')
  })

  it('memformat label berbahasa Indonesia', () => {
    expect(formatMonthLabel('2026-11')).toBe('November 2026')
    expect(formatDateLong('2026-11-03')).toBe('Selasa, 3 November 2026')
  })
})
