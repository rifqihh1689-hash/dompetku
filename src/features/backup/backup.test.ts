import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { resetDatabase } from '../../test/db-utils'
import { makeTx } from '../../test/fixtures'
import { DEFAULT_CATEGORIES } from '../categories/defaults'
import { addCategory, getCategories } from '../categories/repository'
import { setBudget } from '../budget/repository'
import { addRecurringRule } from '../recurring/repository'
import { BACKUP_VERSION, backupFileName, createBackup, escapeCsvField, parseBackup, serializeBackup, transactionsToCsv } from './backup'
import { clearAllData, exportBackup, importBackup } from './repository'

const emptyData = { categories: [], transactions: [], budgets: [], recurring: [] }

describe('parseBackup', () => {
  it('menolak JSON rusak dan file yang bukan backup Dompetku', () => {
    expect(parseBackup('{bukan json')).toEqual({ ok: false, error: 'File bukan JSON yang valid.' })
    expect(parseBackup('{"app":"lain","data":{}}')).toEqual({ ok: false, error: 'File ini bukan backup Dompetku.' })
    expect(parseBackup('[]')).toMatchObject({ ok: false })
  })

  it('menolak versi yang lebih baru', () => {
    const text = JSON.stringify({ app: 'dompetku', version: BACKUP_VERSION + 1, data: emptyData })
    expect(parseBackup(text)).toMatchObject({ ok: false, error: expect.stringMatching(/Versi/) })
  })

  it('melaporkan baris yang tidak valid', () => {
    const bad = createBackup({ ...emptyData, transactions: [makeTx(), makeTx({ amount: -5 })] })
    expect(parseBackup(serializeBackup(bad))).toEqual({
      ok: false,
      error: 'Transaksi ke-2 tidak valid: jumlah harus bilangan bulat positif.',
    })
    const badDate = createBackup({ ...emptyData, transactions: [makeTx({ date: '2026-02-30' })] })
    expect(parseBackup(serializeBackup(badDate))).toMatchObject({ ok: false, error: expect.stringMatching(/tanggal/) })
  })

  it('membaca backup valid dan melengkapi kolom opsional', () => {
    const text = JSON.stringify({
      app: 'dompetku',
      version: 1,
      exportedAt: '2026-11-03T00:00:00.000Z',
      data: {
        transactions: [{ id: 'a', amount: 1000, type: 'expense', categoryId: '#cat-makan', date: '2026-11-03' }],
        budgets: [{ id: 'apa-saja', month: '2026-11', categoryId: '#cat-makan', amount: 5000 }],
      },
    })
    const result = parseBackup(text)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.data.transactions[0]).toEqual({
      id: 'a',
      amount: 1000,
      type: 'expense',
      categoryId: '#cat-makan',
      date: '2026-11-03',
      note: '',
      createdAt: 0,
      updatedAt: 0,
    })
    expect(result.backup.data.budgets[0].id).toBe('#2026-11:#cat-makan')
    expect(result.backup.data.categories).toEqual([])
  })
})

describe('CSV', () => {
  const names: Record<string, string> = { '#cat-makan': 'Makan', '#cat-gaji': 'Gaji' }
  const getName = (id: string) => names[id] ?? 'Tanpa kategori'

  it('membuat header dan baris berurutan tanggal dengan pemisah titik koma', () => {
    const csv = transactionsToCsv(
      [
        makeTx({ date: '2026-11-03', amount: 25000, note: 'Nasi goreng', categoryId: '#cat-makan' }),
        makeTx({ date: '2026-11-01', amount: 8500000, type: 'income', categoryId: '#cat-gaji' }),
      ],
      getName,
    )
    expect(csv.split('\r\n')).toEqual([
      'Tanggal;Jenis;Kategori;Jumlah;Catatan',
      '2026-11-01;Pemasukan;Gaji;8500000;',
      '2026-11-03;Pengeluaran;Makan;25000;Nasi goreng',
    ])
  })

  it('meng-escape pemisah, tanda kutip, dan baris baru', () => {
    expect(escapeCsvField('a;b', ';')).toBe('"a;b"')
    expect(escapeCsvField('a,b', ';')).toBe('a,b')
    expect(escapeCsvField('a,b', ',')).toBe('"a,b"')
    expect(escapeCsvField('kata "kutip"', ';')).toBe('"kata ""kutip"""')
    expect(escapeCsvField('baris\nbaru', ';')).toBe('"baris\nbaru"')
  })

  it('mencegah teks dibaca sebagai rumus oleh Excel', () => {
    const csv = transactionsToCsv([makeTx({ note: '=HYPERLINK("x")', categoryId: '#cat-makan' })], getName, ',')
    expect(csv.split('\r\n')[1]).toBe(`2026-11-03,Pengeluaran,Makan,10000,"'=HYPERLINK(""x"")"`)
  })

  it('nama file berisi tanggal', () => {
    expect(backupFileName(new Date(2026, 10, 3))).toBe('dompetku-backup-2026-11-03.json')
  })
})

describe('export & import database', () => {
  beforeEach(resetDatabase)

  async function seed() {
    const kopi = await addCategory({ name: 'Kopi', icon: 'coffee', color: '#78350f', kind: 'expense' })
    await db.transactions.bulkAdd([
      makeTx({ id: 't1', categoryId: kopi.id }),
      makeTx({ id: 't2', type: 'income', categoryId: '#cat-gaji' }),
    ])
    await setBudget('2026-11', kopi.id, 200_000)
    await addRecurringRule({
      amount: 100_000,
      type: 'expense',
      categoryId: '#cat-tagihan',
      note: 'Internet',
      dayOfMonth: 10,
      startMonth: '2026-11',
    })
    return kopi
  }

  it('export → JSON → import (ganti semua) menghasilkan data yang sama', async () => {
    await seed()
    const before = await exportBackup(new Date('2026-11-03T10:00:00Z'))
    const text = serializeBackup(before)

    await clearAllData()
    expect(await db.transactions.count()).toBe(0)
    expect(await getCategories()).toHaveLength(8)

    const parsed = parseBackup(text)
    if (!parsed.ok) throw new Error(parsed.error)
    await importBackup(parsed.backup, 'replace')

    const after = await exportBackup(new Date('2026-11-03T10:00:00Z'))
    expect(after).toEqual(before)
    // Hanya kategori buatan pengguna yang disimpan; kategori bawaan tersirat.
    expect(after.data.categories.map((c) => c.name)).toEqual(['Kopi'])
    expect(await getCategories()).toHaveLength(9)
    expect(after.data.transactions).toHaveLength(2)
    expect(after.data.budgets).toHaveLength(1)
    expect(after.data.recurring).toHaveLength(1)
  })

  it('mode gabung mempertahankan data lama dan menimpa ID yang sama', async () => {
    await db.transactions.bulkAdd([makeTx({ id: 'lama', amount: 1 }), makeTx({ id: 'sama', amount: 2 })])
    const backup = createBackup({ ...emptyData, transactions: [makeTx({ id: 'sama', amount: 99 }), makeTx({ id: 'baru', amount: 3 })] })
    await importBackup(backup, 'merge')
    const all = await db.transactions.toArray()
    expect(Object.fromEntries(all.map((t) => [t.id, t.amount]))).toEqual({ lama: 1, sama: 99, baru: 3 })
  })

  it('mode ganti menghapus data lama; kategori bawaan tetap tersedia', async () => {
    await seed()
    await importBackup(createBackup(emptyData), 'replace')
    expect(await db.transactions.count()).toBe(0)
    expect(await db.categories.count()).toBe(0)
    expect((await getCategories()).map((c) => c.name)).toContain('Lainnya')
  })
})

describe('kompatibilitas backup lama (v1)', () => {
  it('mengonversi ID kategori bawaan lama', () => {
    const legacyCategories = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: c.id.slice(1) }))
    const text = JSON.stringify({
      app: 'dompetku',
      version: 1,
      exportedAt: '2026-11-01T00:00:00.000Z',
      data: {
        categories: legacyCategories,
        transactions: [makeTx({ id: 'x', categoryId: 'cat-gaji', type: 'income' })],
        budgets: [{ id: '2026-11:cat-makan', month: '2026-11', categoryId: 'cat-makan', amount: 1000 }],
        recurring: [],
      },
    })
    const result = parseBackup(text)
    if (!result.ok) throw new Error(result.error)
    expect(result.backup.data.categories).toEqual([])
    expect(result.backup.data.transactions[0].categoryId).toBe('#cat-gaji')
    expect(result.backup.data.budgets[0]).toEqual({ id: '#2026-11:#cat-makan', month: '2026-11', categoryId: '#cat-makan', amount: 1000 })
  })
})
