import { describe, expect, it } from 'vitest'
import { getDefaultCategory, makeTx } from '../../test/fixtures'
import { EMPTY_FILTER, filterTransactions, groupByDate, isFilterActive } from './filters'

const data = [
  makeTx({ id: 'a', amount: 25000, note: 'Nasi goreng', categoryId: '#cat-makan', date: '2026-11-03' }),
  makeTx({ id: 'b', amount: 150000, note: 'Bensin motor', categoryId: '#cat-transportasi', date: '2026-11-02' }),
  makeTx({ id: 'c', amount: 8000000, type: 'income', note: '', categoryId: '#cat-gaji', date: '2026-10-25' }),
  makeTx({ id: 'd', amount: 50000, note: 'Kafé', categoryId: '#cat-hiburan', date: '2026-10-10' }),
]
const ids = (list: { id: string }[]) => list.map((t) => t.id)

describe('filterTransactions', () => {
  it('tanpa filter mengembalikan semua', () => {
    expect(ids(filterTransactions(data, EMPTY_FILTER, getDefaultCategory))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('menyaring berdasarkan bulan, kategori, dan jenis', () => {
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, month: '2026-10' }, getDefaultCategory))).toEqual(['c', 'd'])
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, categoryId: '#cat-transportasi' }, getDefaultCategory))).toEqual(['b'])
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, type: 'income' }, getDefaultCategory))).toEqual(['c'])
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, month: '2026-11', type: 'income' }, getDefaultCategory))).toEqual([])
  })

  it('mencari di catatan (tanpa peka huruf besar & aksen)', () => {
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, query: 'NASI' }, getDefaultCategory))).toEqual(['a'])
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, query: 'kafe' }, getDefaultCategory))).toEqual(['d'])
  })

  it('mencari di nama kategori', () => {
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, query: 'gaji' }, getDefaultCategory))).toEqual(['c'])
  })

  it('mencari berdasarkan nominal, dengan atau tanpa titik', () => {
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, query: '150.000' }, getDefaultCategory))).toEqual(['b'])
    expect(ids(filterTransactions(data, { ...EMPTY_FILTER, query: '25000' }, getDefaultCategory))).toEqual(['a'])
  })

  it('mendeteksi filter aktif', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, query: '  ' })).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, type: 'expense' })).toBe(true)
  })
})

describe('groupByDate', () => {
  it('mengelompokkan per tanggal dengan subtotal', () => {
    const groups = groupByDate([
      makeTx({ date: '2026-11-03', amount: 1000 }),
      makeTx({ date: '2026-11-03', amount: 5000, type: 'income' }),
      makeTx({ date: '2026-11-01', amount: 2000 }),
    ])
    expect(groups.map((g) => [g.date, g.income, g.expense, g.transactions.length])).toEqual([
      ['2026-11-03', 5000, 1000, 2],
      ['2026-11-01', 0, 2000, 1],
    ])
  })
})
