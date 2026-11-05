import { describe, expect, it } from 'vitest'
import { makeTx } from '../../test/fixtures'
import ringkasan from './__fixtures__/ringkasan-dompetku.json'
import { buildSummary } from './summary'

const names: Record<string, string> = {
  '#cat-makan': 'Makan',
  '#cat-tagihan': 'Tagihan',
  '#cat-gaji': 'Gaji',
  '#mbappe-tentir': 'Tentir 1:1 (Mbappe)',
}
const getName = (id: string) => names[id] ?? 'Tanpa kategori'

const transactions = [
  // Agustus–Oktober: pengeluaran 1,2 jt / 1,5 jt / 1,8 jt
  makeTx({ date: '2026-08-10', amount: 1_200_000, categoryId: '#cat-tagihan' }),
  makeTx({ date: '2026-09-10', amount: 1_500_000, categoryId: '#cat-tagihan' }),
  makeTx({ date: '2026-10-10', amount: 1_800_000, categoryId: '#cat-tagihan' }),
  makeTx({ date: '2026-10-25', amount: 5_000_000, type: 'income', categoryId: '#cat-gaji' }),
  // November (bulan ini)
  makeTx({ date: '2026-11-01', amount: 300_000, type: 'income', categoryId: '#mbappe-tentir', id: 'mbappe-kas-kas_a1' }),
  makeTx({ date: '2026-11-02', amount: 50_000, categoryId: '#cat-makan' }),
  makeTx({ date: '2026-11-03', amount: 350_000, categoryId: '#cat-tagihan' }),
  makeTx({ date: '2026-11-04', amount: 30_000, categoryId: '#cat-makan' }),
]

describe('ringkasan untuk Markas Mbappe', () => {
  const summary = buildSummary(transactions, getName, '2026-11-05', new Date('2026-11-05T08:00:00.000Z'))

  it('menghitung saldo, bulan ini, dan rata-rata 3 bulan sebelumnya', () => {
    expect(summary.saldo).toBe(5_300_000 - 1_200_000 - 1_500_000 - 1_800_000 - 430_000)
    expect(summary.bulanIni).toEqual({ bulan: '2026-11', pemasukan: 300_000, pengeluaran: 430_000 })
    expect(summary.rataPengeluaranBulanan).toBe(1_500_000)
    expect(summary.dasarRata).toBe('bulan-sebelumnya')
    expect(summary.bulanan.map((m) => m.bulan)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    expect(summary.pengeluaranTerbesar).toEqual([
      { kategori: 'Tagihan', total: 350_000 },
      { kategori: 'Makan', total: 80_000 },
    ])
    expect(summary.pemasukanDariMbappe).toBe(300_000)
  })

  it('tidak memuat rincian transaksi atau catatan', () => {
    const text = JSON.stringify(summary)
    expect(text).not.toContain('"note"')
    expect(text).not.toContain('"transactions"')
  })

  it('cocok dengan fixture kontrak yang dibaca Markas Mbappe', () => {
    expect(summary).toEqual(ringkasan)
  })

  it('memperkirakan dari bulan ini bila belum ada bulan sebelumnya', () => {
    const s = buildSummary([makeTx({ date: '2026-11-05', amount: 100_000 })], getName, '2026-11-05')
    expect(s.dasarRata).toBe('perkiraan-bulan-ini')
    expect(s.rataPengeluaranBulanan).toBe(600_000) // 100 rb dalam 5 hari → 30 hari
    expect(buildSummary([], getName, '2026-11-05').dasarRata).toBe('belum-ada')
  })
})
