import { addMonths, daysInMonth, monthOf } from '../../lib/date'
import type { ISODate, MonthKey, Transaction } from '../../types'
import { MBAPPE_TX_PREFIX, SUMMARY_APP, SUMMARY_VERSION } from './constants'

export interface MonthTotals {
  bulan: MonthKey
  pemasukan: number
  pengeluaran: number
}

/**
 * Ringkasan keuangan yang dikirim ke Markas Mbappe.
 * Hanya angka agregat, tanpa rincian transaksi atau catatan.
 */
export interface DompetkuSummary {
  app: typeof SUMMARY_APP
  version: typeof SUMMARY_VERSION
  exportedAt: string
  /** Tanggal data (hari ini, waktu lokal). */
  tanggal: ISODate
  /** Saldo keseluruhan: semua pemasukan − semua pengeluaran. */
  saldo: number
  bulanIni: MonthTotals
  /** Enam bulan terakhir termasuk bulan ini, dari yang terlama. */
  bulanan: MonthTotals[]
  /** Rata-rata pengeluaran per bulan (lihat `dasarRata`). */
  rataPengeluaranBulanan: number
  /**
   * - `bulan-sebelumnya`: rata-rata hingga 3 bulan sebelumnya yang punya transaksi
   * - `perkiraan-bulan-ini`: belum ada bulan sebelumnya, diperkirakan dari bulan ini
   * - `belum-ada`: belum ada pengeluaran sama sekali
   */
  dasarRata: 'bulan-sebelumnya' | 'perkiraan-bulan-ini' | 'belum-ada'
  /** Lima kategori pengeluaran terbesar bulan ini. */
  pengeluaranTerbesar: { kategori: string; total: number }[]
  /** Total pemasukan yang berasal dari Markas Mbappe (agar tidak dihitung dua kali). */
  pemasukanDariMbappe: number
  jumlahTransaksi: number
}

function totalsFor(transactions: readonly Transaction[], month: MonthKey): MonthTotals & { count: number } {
  let pemasukan = 0
  let pengeluaran = 0
  let count = 0
  for (const tx of transactions) {
    if (!tx.date.startsWith(`${month}-`)) continue
    count++
    if (tx.type === 'income') pemasukan += tx.amount
    else pengeluaran += tx.amount
  }
  return { bulan: month, pemasukan, pengeluaran, count }
}

export function buildSummary(
  transactions: readonly Transaction[],
  getCategoryName: (id: string) => string,
  today: ISODate,
  now: Date = new Date(),
): DompetkuSummary {
  const month = monthOf(today)
  const saldo = transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0)
  const current = totalsFor(transactions, month)

  const bulanan = Array.from({ length: 6 }, (_, i) => {
    const { bulan, pemasukan, pengeluaran } = totalsFor(transactions, addMonths(month, i - 5))
    return { bulan, pemasukan, pengeluaran }
  })

  const previous = [1, 2, 3].map((i) => totalsFor(transactions, addMonths(month, -i))).filter((m) => m.count > 0)
  let rataPengeluaranBulanan = 0
  let dasarRata: DompetkuSummary['dasarRata'] = 'belum-ada'
  if (previous.length > 0) {
    rataPengeluaranBulanan = Math.round(previous.reduce((s, m) => s + m.pengeluaran, 0) / previous.length)
    dasarRata = 'bulan-sebelumnya'
  } else if (current.pengeluaran > 0) {
    const elapsed = Number(today.slice(8, 10))
    rataPengeluaranBulanan = Math.round((current.pengeluaran / elapsed) * daysInMonth(month))
    dasarRata = 'perkiraan-bulan-ini'
  }

  const perKategori = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.date.startsWith(`${month}-`)) continue
    const name = getCategoryName(tx.categoryId)
    perKategori.set(name, (perKategori.get(name) ?? 0) + tx.amount)
  }
  const pengeluaranTerbesar = [...perKategori.entries()]
    .map(([kategori, total]) => ({ kategori, total }))
    .sort((a, b) => b.total - a.total || a.kategori.localeCompare(b.kategori))
    .slice(0, 5)

  const pemasukanDariMbappe = transactions
    .filter((tx) => tx.type === 'income' && tx.id.startsWith(MBAPPE_TX_PREFIX))
    .reduce((sum, tx) => sum + tx.amount, 0)

  return {
    app: SUMMARY_APP,
    version: SUMMARY_VERSION,
    exportedAt: now.toISOString(),
    tanggal: today,
    saldo,
    bulanIni: { bulan: current.bulan, pemasukan: current.pemasukan, pengeluaran: current.pengeluaran },
    bulanan,
    rataPengeluaranBulanan,
    dasarRata,
    pengeluaranTerbesar,
    pemasukanDariMbappe,
    jumlahTransaksi: transactions.length,
  }
}

export function summaryFileName(today: ISODate): string {
  return `dompetku-ringkasan-${today}.json`
}
