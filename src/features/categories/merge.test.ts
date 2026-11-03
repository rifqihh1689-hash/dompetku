import { describe, expect, it } from 'vitest'
import type { Category } from '../../types'
import { DEFAULT_CATEGORIES } from './defaults'
import { mergeCategories, normalizeCategoryRows } from './merge'

const custom: Category = {
  id: 'uuid-kopi',
  name: 'Kopi',
  icon: 'coffee',
  color: '#000000',
  kind: 'expense',
  builtIn: false,
  createdAt: 100,
}
const legacy = (c: Category): Category => ({ ...c, id: c.id.slice(1) })

describe('mergeCategories', () => {
  it('tanpa baris → kategori bawaan saja', () => {
    expect(mergeCategories([])).toEqual(DEFAULT_CATEGORIES)
  })

  it('menerapkan perubahan, menyembunyikan yang dihapus, dan menambah kategori kustom', () => {
    const merged = mergeCategories([
      { ...DEFAULT_CATEGORIES[0], name: 'Makanan' },
      { ...DEFAULT_CATEGORIES[4], deleted: true },
      { ...DEFAULT_CATEGORIES[7], deleted: true }, // "Lainnya" tidak bisa disembunyikan
      custom,
      { ...custom, id: 'uuid-hapus', name: 'Terhapus', deleted: true },
    ])
    expect(merged.map((c) => c.name)).toEqual(['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Gaji', 'Lainnya', 'Kopi'])
    expect(merged.every((c) => !('deleted' in c))).toBe(true)
  })

  it('membuang properti sinkronisasi', () => {
    const merged = mergeCategories([{ ...custom, owner: 'u1', realmId: 'u1' } as Category])
    expect(merged.at(-1)).toEqual(custom)
  })
})

describe('normalizeCategoryRows (format lama → baru)', () => {
  it('membuang kategori bawaan yang tidak diubah dan memetakan ID lama', () => {
    const rows = [...DEFAULT_CATEGORIES.map(legacy), custom]
    expect(normalizeCategoryRows(rows)).toEqual([custom])
  })

  it('menyimpan kategori bawaan yang diubah dengan ID baru', () => {
    const rows = [...DEFAULT_CATEGORIES.map(legacy)]
    rows[0] = { ...rows[0], name: 'Makanan' }
    expect(normalizeCategoryRows(rows)).toEqual([{ ...DEFAULT_CATEGORIES[0], name: 'Makanan' }])
  })

  it('kategori bawaan yang dulu dihapus ditandai deleted (hanya untuk daftar lengkap)', () => {
    const withoutHiburan = DEFAULT_CATEGORIES.filter((c) => c.name !== 'Hiburan').map(legacy)
    expect(normalizeCategoryRows(withoutHiburan)).toEqual([{ ...DEFAULT_CATEGORIES[4], deleted: true }])
    // Daftar parsial (tanpa "Lainnya") tidak dianggap menghapus apa pun.
    expect(normalizeCategoryRows([custom])).toEqual([custom])
  })

  it('idempoten untuk data format baru', () => {
    const rows = [{ ...DEFAULT_CATEGORIES[0], name: 'Makanan' }, { ...DEFAULT_CATEGORIES[4], deleted: true }, custom]
    expect(normalizeCategoryRows(rows)).toEqual(rows)
  })
})
