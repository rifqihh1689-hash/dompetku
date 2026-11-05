import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { resetDatabase } from '../../test/db-utils'
import { makeTx } from '../../test/fixtures'
import { parseBackup, type BackupFile } from '../backup/backup'
import { getCategories, updateCategory } from '../categories/repository'
import kiriman from './__fixtures__/kiriman-markas-mbappe.json'
import { importFromMbappe, isMbappeFile } from './import'

/** File yang dihasilkan tombol "Kirim ke Dompetku" di Markas Mbappe (kontrak format antar-aplikasi). */
function parseKiriman(data: unknown = kiriman): BackupFile {
  const result = parseBackup(JSON.stringify(data))
  if (!result.ok) throw new Error(result.error)
  return result.backup
}

describe('kiriman Markas Mbappe', () => {
  beforeEach(resetDatabase)

  it('terbaca sebagai file Markas Mbappe yang valid', () => {
    const backup = parseKiriman()
    expect(isMbappeFile(backup)).toBe(true)
    expect(backup.data.transactions).toHaveLength(3)
    expect(backup.data.transactions.every((t) => t.type === 'income')).toBe(true)
    expect(backup.data.categories.map((c) => c.name)).toEqual(['Tentir 1:1 (Mbappe)', 'Meja Riset (Mbappe)', 'Lainnya (Mbappe)'])
  })

  it('menambahkan pemasukan & kategori sumber tanpa menyentuh transaksi lain', async () => {
    await db.transactions.add(makeTx({ id: 'milik-dompetku', amount: 25000 }))
    expect(await importFromMbappe(parseKiriman())).toEqual({ added: 3, updated: 0, removed: 0 })
    expect(await db.transactions.count()).toBe(4)
    expect(await db.transactions.get('milik-dompetku')).toBeDefined()
    const names = (await getCategories()).map((c) => c.name)
    expect(names).toEqual(expect.arrayContaining(['Tentir 1:1 (Mbappe)', 'Meja Riset (Mbappe)', 'Lainnya (Mbappe)']))
  })

  it('impor berulang tidak menggandakan', async () => {
    await importFromMbappe(parseKiriman())
    expect(await importFromMbappe(parseKiriman())).toEqual({ added: 0, updated: 3, removed: 0 })
    expect(await db.transactions.count()).toBe(3)
  })

  it('pemasukan yang dihapus di Markas Mbappe ikut dihapus', async () => {
    await importFromMbappe(parseKiriman())
    const tanpaRiset = structuredClone(kiriman)
    tanpaRiset.data.transactions = tanpaRiset.data.transactions.filter((t) => !t.id.includes('riset'))
    expect(await importFromMbappe(parseKiriman(tanpaRiset))).toEqual({ added: 0, updated: 2, removed: 1 })
    expect(await db.transactions.get('mbappe-kas-riset_r1_dp')).toBeUndefined()
  })

  it('mempertahankan perubahan nama kategori yang dibuat di Dompetku', async () => {
    await importFromMbappe(parseKiriman())
    await updateCategory('#mbappe-tentir', { name: 'Ngajar tentir', icon: 'book', color: '#000000', kind: 'income' })
    await importFromMbappe(parseKiriman())
    expect((await getCategories()).find((c) => c.id === '#mbappe-tentir')?.name).toBe('Ngajar tentir')
  })
})
