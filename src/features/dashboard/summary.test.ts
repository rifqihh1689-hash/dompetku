import { describe, expect, it } from 'vitest'
import { getDefaultCategory, makeTx } from '../../test/fixtures'
import { averageDailyExpense, dailyTrend, expenseByCategory, limitSlices, summarize } from './summary'

describe('summarize', () => {
  it('menghitung pemasukan, pengeluaran, dan saldo', () => {
    const result = summarize([
      makeTx({ type: 'income', amount: 8_000_000 }),
      makeTx({ type: 'expense', amount: 1_250_000 }),
      makeTx({ type: 'expense', amount: 750_000 }),
    ])
    expect(result).toEqual({ income: 8_000_000, expense: 2_000_000, balance: 6_000_000, count: 3 })
  })

  it('saldo bisa negatif', () => {
    expect(summarize([makeTx({ type: 'expense', amount: 5000 })]).balance).toBe(-5000)
  })

  it('daftar kosong menghasilkan nol', () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0, count: 0 })
  })
})

describe('expenseByCategory', () => {
  it('mengelompokkan pengeluaran per kategori dan mengabaikan pemasukan', () => {
    const slices = expenseByCategory(
      [
        makeTx({ categoryId: 'cat-makan', amount: 30000 }),
        makeTx({ categoryId: 'cat-makan', amount: 20000 }),
        makeTx({ categoryId: 'cat-transportasi', amount: 150000 }),
        makeTx({ categoryId: 'cat-gaji', type: 'income', amount: 9_000_000 }),
      ],
      getDefaultCategory,
    )
    expect(slices.map((s) => [s.name, s.total])).toEqual([
      ['Transportasi', 150000],
      ['Makan', 50000],
    ])
    expect(slices[0].ratio).toBeCloseTo(0.75)
    expect(slices[1].ratio).toBeCloseTo(0.25)
  })

  it('kategori yang tidak dikenal tetap dihitung', () => {
    const slices = expenseByCategory([makeTx({ categoryId: 'hilang', amount: 1000 })], getDefaultCategory)
    expect(slices[0].name).toBe('Tanpa kategori')
  })
})

describe('limitSlices', () => {
  it('menggabungkan kategori kecil menjadi "Kategori lain"', () => {
    const slices = Array.from({ length: 8 }, (_, i) => ({
      categoryId: `c${i}`,
      name: `C${i}`,
      icon: 'tag',
      color: '#000',
      total: 100 - i,
      ratio: 1 / 8,
    }))
    const limited = limitSlices(slices, 6)
    expect(limited).toHaveLength(6)
    expect(limited[5].name).toBe('Kategori lain')
    expect(limited[5].total).toBe(95 + 94 + 93)
    expect(limitSlices(slices.slice(0, 3), 6)).toHaveLength(3)
  })
})

describe('dailyTrend', () => {
  it('membuat satu titik per hari dalam bulan', () => {
    const points = dailyTrend(
      [
        makeTx({ date: '2026-02-01', amount: 1000 }),
        makeTx({ date: '2026-02-01', amount: 500 }),
        makeTx({ date: '2026-02-28', amount: 2000, type: 'income' }),
        makeTx({ date: '2026-03-01', amount: 9999 }),
      ],
      '2026-02',
    )
    expect(points).toHaveLength(28)
    expect(points[0]).toEqual({ day: 1, date: '2026-02-01', income: 0, expense: 1500 })
    expect(points[27].income).toBe(2000)
    expect(points.reduce((s, p) => s + p.expense, 0)).toBe(1500)
  })

  it('menghitung rata-rata pengeluaran harian sampai hari ini', () => {
    const points = dailyTrend([makeTx({ date: '2026-11-01', amount: 30000 }), makeTx({ date: '2026-11-03', amount: 30000 })], '2026-11')
    expect(averageDailyExpense(points, '2026-11-03')).toBe(20000)
    expect(averageDailyExpense(points, '2026-12-15')).toBe(2000)
    expect(averageDailyExpense(points, '2026-10-15')).toBe(0)
  })
})
