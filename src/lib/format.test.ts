import { describe, expect, it } from 'vitest'
import { formatAmountInput, formatCompactRupiah, formatPercent, formatRupiah, parseAmount } from './format'

describe('formatRupiah', () => {
  it('memformat dengan pemisah ribuan titik', () => {
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000')
    expect(formatRupiah(0)).toBe('Rp 0')
    expect(formatRupiah(999)).toBe('Rp 999')
    expect(formatRupiah(1000)).toBe('Rp 1.000')
    expect(formatRupiah(1234567890)).toBe('Rp 1.234.567.890')
  })

  it('menampilkan tanda minus di depan untuk nilai negatif', () => {
    expect(formatRupiah(-5000)).toBe('-Rp 5.000')
  })

  it('membulatkan desimal', () => {
    expect(formatRupiah(1500.6)).toBe('Rp 1.501')
  })
})

describe('parseAmount', () => {
  it('mengabaikan karakter non-digit', () => {
    expect(parseAmount('Rp 1.250.000')).toBe(1250000)
    expect(parseAmount('12a3')).toBe(123)
  })

  it('mengembalikan 0 untuk masukan kosong', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })

  it('membatasi jumlah digit', () => {
    expect(parseAmount('1'.repeat(20))).toBe(Number('1'.repeat(15)))
  })
})

describe('formatAmountInput', () => {
  it('memformat saat diketik dan membuang nol di depan', () => {
    expect(formatAmountInput('1250000')).toBe('1.250.000')
    expect(formatAmountInput('0005000')).toBe('5.000')
    expect(formatAmountInput('')).toBe('')
    expect(formatAmountInput('0')).toBe('0')
  })
})

describe('formatCompactRupiah & formatPercent', () => {
  it('meringkas nilai besar', () => {
    expect(formatCompactRupiah(1_500_000)).toBe('1,5 jt')
    expect(formatCompactRupiah(250_000)).toBe('250 rb')
    expect(formatCompactRupiah(2_000_000_000)).toBe('2 M')
    expect(formatCompactRupiah(500)).toBe('500')
  })

  it('memformat persen', () => {
    expect(formatPercent(0.8567)).toBe('86%')
    expect(formatPercent(1.2)).toBe('120%')
  })
})
