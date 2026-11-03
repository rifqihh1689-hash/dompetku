import type { TransactionType } from '../../types'

/** Pilihan jenis transaksi untuk SegmentedControl. */
export const TYPE_OPTIONS = [
  { value: 'expense', label: 'Pengeluaran', activeClassName: 'bg-rose-600 text-white shadow-sm' },
  { value: 'income', label: 'Pemasukan', activeClassName: 'bg-emerald-600 text-white shadow-sm' },
] as const satisfies readonly { value: TransactionType; label: string; activeClassName: string }[]
