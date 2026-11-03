import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { formatRupiah } from '../../lib/format'
import { resetDatabase } from '../../test/db-utils'
import { getDefaultCategory, makeTx } from '../../test/fixtures'
import { DEFAULT_CATEGORIES } from '../categories/defaults'
import { budgetAlerts, budgetLevel, budgetMessage, computeBudgetUsage, totalBudget } from './budget'
import { checkBudget, copyBudgets, setBudget } from './repository'

describe('budgetLevel', () => {
  it('aman di bawah 80%', () => {
    expect(budgetLevel(0, 100_000)).toBe('safe')
    expect(budgetLevel(79_999, 100_000)).toBe('safe')
  })

  it('peringatan mulai 80% sampai 100%', () => {
    expect(budgetLevel(80_000, 100_000)).toBe('warning')
    expect(budgetLevel(100_000, 100_000)).toBe('warning')
  })

  it('melebihi bila lebih dari 100%', () => {
    expect(budgetLevel(100_001, 100_000)).toBe('over')
  })

  it('anggaran 0 dianggap melebihi jika ada pengeluaran', () => {
    expect(budgetLevel(0, 0)).toBe('safe')
    expect(budgetLevel(1, 0)).toBe('over')
  })
})

describe('computeBudgetUsage', () => {
  const budgets = [
    { id: '2026-11:cat-makan', month: '2026-11', categoryId: 'cat-makan', amount: 1_000_000 },
    { id: '2026-11:cat-hiburan', month: '2026-11', categoryId: 'cat-hiburan', amount: 200_000 },
    { id: '2026-11:cat-transportasi', month: '2026-11', categoryId: 'cat-transportasi', amount: 500_000 },
  ]
  const transactions = [
    makeTx({ categoryId: 'cat-makan', amount: 850_000, date: '2026-11-10' }),
    makeTx({ categoryId: 'cat-hiburan', amount: 250_000, date: '2026-11-05' }),
    makeTx({ categoryId: 'cat-transportasi', amount: 100_000, date: '2026-11-02' }),
    // diabaikan: bulan lain & pemasukan
    makeTx({ categoryId: 'cat-makan', amount: 900_000, date: '2026-10-31' }),
    makeTx({ categoryId: 'cat-makan', amount: 900_000, date: '2026-11-01', type: 'income' }),
  ]

  it('menghitung terpakai, sisa, dan status, diurutkan dari paling kritis', () => {
    const usages = computeBudgetUsage(budgets, transactions, getDefaultCategory)
    expect(usages.map((u) => [u.category.name, u.spent, u.remaining, u.level])).toEqual([
      ['Hiburan', 250_000, -50_000, 'over'],
      ['Makan', 850_000, 150_000, 'warning'],
      ['Transportasi', 100_000, 400_000, 'safe'],
    ])
    expect(budgetAlerts(usages).map((u) => u.category.name)).toEqual(['Hiburan', 'Makan'])
  })

  it('menjumlahkan total anggaran', () => {
    const totals = totalBudget(computeBudgetUsage(budgets, transactions, getDefaultCategory))
    expect(totals).toMatchObject({ limit: 1_700_000, spent: 1_200_000, remaining: 500_000, level: 'safe' })
  })

  it('membuat pesan peringatan berbahasa Indonesia', () => {
    const [over, warning] = computeBudgetUsage(budgets, transactions, getDefaultCategory)
    expect(budgetMessage(over, formatRupiah)).toBe('Anggaran Hiburan terlampaui Rp 50.000')
    expect(budgetMessage(warning, formatRupiah)).toBe('Anggaran Makan sudah 85% terpakai (sisa Rp 150.000)')
  })
})

describe('repository anggaran', () => {
  beforeEach(resetDatabase)
  const makan = DEFAULT_CATEGORIES[0]

  it('satu anggaran per kategori per bulan (set menimpa)', async () => {
    await setBudget('2026-11', makan.id, 500_000)
    await setBudget('2026-11', makan.id, 750_000)
    const all = await db.budgets.toArray()
    expect(all).toEqual([{ id: '2026-11:cat-makan', month: '2026-11', categoryId: 'cat-makan', amount: 750_000 }])
    await expect(setBudget('2026-11', makan.id, 0)).rejects.toThrow()
  })

  it('menyalin anggaran ke bulan berikutnya tanpa menimpa', async () => {
    await setBudget('2026-10', 'cat-makan', 500_000)
    await setBudget('2026-10', 'cat-hiburan', 200_000)
    await setBudget('2026-11', 'cat-hiburan', 300_000)
    expect(await copyBudgets('2026-10', '2026-11')).toBe(1)
    const nov = await db.budgets.where('month').equals('2026-11').toArray()
    expect(nov.map((b) => [b.categoryId, b.amount]).sort()).toEqual([
      ['cat-hiburan', 300_000],
      ['cat-makan', 500_000],
    ])
  })

  it('memberi peringatan setelah pengeluaran melewati 80% dan 100%', async () => {
    await setBudget('2026-11', makan.id, 100_000)
    await db.transactions.add(makeTx({ categoryId: makan.id, amount: 50_000, date: '2026-11-01' }))
    expect(await checkBudget('2026-11', makan)).toBeNull()

    await db.transactions.add(makeTx({ categoryId: makan.id, amount: 35_000, date: '2026-11-02' }))
    expect(await checkBudget('2026-11', makan)).toEqual({ level: 'warning', message: 'Anggaran Makan sudah 85% terpakai (sisa Rp 15.000)' })

    await db.transactions.add(makeTx({ categoryId: makan.id, amount: 20_000, date: '2026-11-03' }))
    expect(await checkBudget('2026-11', makan)).toEqual({ level: 'over', message: 'Anggaran Makan terlampaui Rp 5.000' })
  })

  it('tanpa anggaran tidak ada peringatan', async () => {
    await db.transactions.add(makeTx({ categoryId: makan.id, amount: 999_999, date: '2026-11-01' }))
    expect(await checkBudget('2026-11', makan)).toBeNull()
  })
})
