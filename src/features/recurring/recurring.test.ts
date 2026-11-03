import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { resetDatabase } from '../../test/db-utils'
import type { RecurringRule } from '../../types'
import { dueOccurrences, monthlyRecurringTotals, nextOccurrence, recurringTransactionId } from './recurring'
import { addRecurringRule, deleteRecurringRule, generateRecurringTransactions, setRecurringActive, updateRecurringRule, validateRecurringInput } from './repository'

function rule(partial: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'r1',
    amount: 350_000,
    type: 'expense',
    categoryId: 'cat-tagihan',
    note: 'Listrik',
    dayOfMonth: 5,
    startMonth: '2026-09',
    active: true,
    createdAt: 0,
    ...partial,
  }
}

describe('dueOccurrences', () => {
  it('membuat kejadian untuk setiap bulan yang sudah jatuh tempo', () => {
    expect(dueOccurrences(rule(), '2026-11-03')).toEqual([
      { month: '2026-09', date: '2026-09-05' },
      { month: '2026-10', date: '2026-10-05' },
    ])
    expect(dueOccurrences(rule(), '2026-11-05').map((o) => o.date)).toEqual(['2026-09-05', '2026-10-05', '2026-11-05'])
  })

  it('melanjutkan dari bulan terakhir yang sudah dibuat', () => {
    expect(dueOccurrences(rule({ lastGeneratedMonth: '2026-10' }), '2026-11-03')).toEqual([])
    expect(dueOccurrences(rule({ lastGeneratedMonth: '2026-10' }), '2026-12-31').map((o) => o.month)).toEqual(['2026-11', '2026-12'])
  })

  it('menyesuaikan tanggal 31 dengan akhir bulan', () => {
    const r = rule({ dayOfMonth: 31, startMonth: '2027-01' })
    expect(dueOccurrences(r, '2027-04-30').map((o) => o.date)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30'])
  })

  it('berhenti pada bulan berakhir', () => {
    expect(dueOccurrences(rule({ endMonth: '2026-09' }), '2026-12-31').map((o) => o.month)).toEqual(['2026-09'])
  })

  it('aturan nonaktif atau belum mulai tidak menghasilkan apa pun', () => {
    expect(dueOccurrences(rule({ active: false }), '2026-12-31')).toEqual([])
    expect(dueOccurrences(rule({ startMonth: '2027-01' }), '2026-12-31')).toEqual([])
  })

  it('bulan mulai yang dimajukan setelah dibuat tetap dihormati', () => {
    expect(dueOccurrences(rule({ lastGeneratedMonth: '2026-09', startMonth: '2026-12' }), '2026-12-10').map((o) => o.month)).toEqual(['2026-12'])
  })
})

describe('nextOccurrence', () => {
  it('memberi tanggal jatuh tempo berikutnya', () => {
    expect(nextOccurrence(rule({ lastGeneratedMonth: '2026-10' }), '2026-11-03')).toBe('2026-11-05')
    expect(nextOccurrence(rule({ lastGeneratedMonth: '2026-11' }), '2026-11-05')).toBe('2026-12-05')
    expect(nextOccurrence(rule({ startMonth: '2027-02', dayOfMonth: 30 }), '2026-11-03')).toBe('2027-02-28')
  })

  it('null bila nonaktif atau sudah berakhir', () => {
    expect(nextOccurrence(rule({ active: false }), '2026-11-03')).toBeNull()
    expect(nextOccurrence(rule({ endMonth: '2026-10', lastGeneratedMonth: '2026-10' }), '2026-11-03')).toBeNull()
  })
})

describe('monthlyRecurringTotals', () => {
  it('menjumlahkan aturan aktif per jenis', () => {
    expect(
      monthlyRecurringTotals([rule({ amount: 100 }), rule({ amount: 50, active: false }), rule({ amount: 1000, type: 'income' })]),
    ).toEqual({ income: 1000, expense: 100 })
  })
})

describe('generateRecurringTransactions', () => {
  beforeEach(resetDatabase)

  const input = { amount: 350_000, type: 'expense' as const, categoryId: 'cat-tagihan', note: 'Listrik', dayOfMonth: 5, startMonth: '2026-09' }

  it('membuat transaksi yang jatuh tempo lalu mencatat bulan terakhir', async () => {
    const r = await addRecurringRule(input)
    expect(await generateRecurringTransactions('2026-11-10')).toBe(3)

    const txs = await db.transactions.orderBy('date').toArray()
    expect(txs.map((t) => [t.date, t.amount, t.note, t.recurringId])).toEqual([
      ['2026-09-05', 350_000, 'Listrik', r.id],
      ['2026-10-05', 350_000, 'Listrik', r.id],
      ['2026-11-05', 350_000, 'Listrik', r.id],
    ])
    expect((await db.recurring.get(r.id))?.lastGeneratedMonth).toBe('2026-11')
  })

  it('idempoten: dipanggil berulang (juga bersamaan) tidak membuat duplikat', async () => {
    await addRecurringRule(input)
    const results = await Promise.all([generateRecurringTransactions('2026-11-10'), generateRecurringTransactions('2026-11-10')])
    expect(results.reduce((a, b) => a + b, 0)).toBe(3)
    expect(await generateRecurringTransactions('2026-11-10')).toBe(0)
    expect(await db.transactions.count()).toBe(3)
  })

  it('transaksi yang dihapus pengguna tidak dibuat ulang', async () => {
    const r = await addRecurringRule(input)
    await generateRecurringTransactions('2026-11-10')
    await db.transactions.delete(recurringTransactionId(r.id, '2026-10'))
    expect(await generateRecurringTransactions('2026-11-10')).toBe(0)
    expect(await db.transactions.count()).toBe(2)
  })

  it('muncul otomatis tiap bulan berikutnya', async () => {
    await addRecurringRule({ ...input, startMonth: '2026-11' })
    expect(await generateRecurringTransactions('2026-11-04')).toBe(0)
    expect(await generateRecurringTransactions('2026-11-05')).toBe(1)
    expect(await generateRecurringTransactions('2026-12-01')).toBe(0)
    expect(await generateRecurringTransactions('2026-12-05')).toBe(1)
    expect(await db.transactions.count()).toBe(2)
  })

  it('aturan nonaktif dilewati; menghapus aturan tidak menghapus transaksi', async () => {
    const r = await addRecurringRule(input)
    await setRecurringActive(r.id, false)
    expect(await generateRecurringTransactions('2026-11-10')).toBe(0)
    await setRecurringActive(r.id, true)
    expect(await generateRecurringTransactions('2026-11-10')).toBe(3)
    await deleteRecurringRule(r.id)
    expect(await db.transactions.count()).toBe(3)
  })

  it('perubahan aturan berlaku untuk bulan berikutnya & bulan berakhir bisa dihapus', async () => {
    const r = await addRecurringRule({ ...input, endMonth: '2026-12' })
    await generateRecurringTransactions('2026-11-10')
    await updateRecurringRule(r.id, { ...input, amount: 400_000, endMonth: undefined })
    const updated = await db.recurring.get(r.id)
    expect(updated?.endMonth).toBeUndefined()
    expect(updated?.lastGeneratedMonth).toBe('2026-11')
    await generateRecurringTransactions('2027-01-05')
    const amounts = (await db.transactions.orderBy('date').toArray()).map((t) => t.amount)
    expect(amounts).toEqual([350_000, 350_000, 350_000, 400_000, 400_000])
  })

  it('memvalidasi input', () => {
    expect(validateRecurringInput({ ...input, amount: 0 })).toMatch(/Jumlah/)
    expect(validateRecurringInput({ ...input, dayOfMonth: 32 })).toMatch(/Tanggal/)
    expect(validateRecurringInput({ ...input, endMonth: '2026-08' })).toMatch(/berakhir/)
    expect(validateRecurringInput(input)).toBeNull()
  })
})
