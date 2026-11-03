/** Jenis transaksi. */
export type TransactionType = 'income' | 'expense'

/** Jenis kategori: khusus pemasukan, khusus pengeluaran, atau keduanya. */
export type CategoryKind = TransactionType | 'both'

/** Tanggal lokal berformat `YYYY-MM-DD`. */
export type ISODate = string

/** Bulan berformat `YYYY-MM`. */
export type MonthKey = string

export interface Category {
  id: string
  name: string
  /** Kunci ikon dari `CATEGORY_ICONS`. */
  icon: string
  /** Warna hex, mis. `#f97316`. */
  color: string
  kind: CategoryKind
  /** Kategori bawaan aplikasi. */
  builtIn: boolean
  createdAt: number
}

export interface Transaction {
  id: string
  /** Jumlah dalam Rupiah (bilangan bulat positif). */
  amount: number
  type: TransactionType
  categoryId: string
  date: ISODate
  note: string
  /** Diisi jika transaksi dibuat otomatis oleh aturan transaksi berulang. */
  recurringId?: string
  createdAt: number
  updatedAt: number
}

export interface Budget {
  /** `${month}:${categoryId}` — satu anggaran per kategori per bulan. */
  id: string
  month: MonthKey
  categoryId: string
  /** Batas anggaran dalam Rupiah. */
  amount: number
}

export interface RecurringRule {
  id: string
  amount: number
  type: TransactionType
  categoryId: string
  note: string
  /** Tanggal jatuh tempo tiap bulan (1–31, otomatis disesuaikan dengan panjang bulan). */
  dayOfMonth: number
  /** Bulan pertama aturan berlaku. */
  startMonth: MonthKey
  /** Bulan terakhir aturan berlaku (opsional). */
  endMonth?: MonthKey
  /** Bulan terakhir yang transaksinya sudah dibuat. */
  lastGeneratedMonth?: MonthKey
  active: boolean
  createdAt: number
}

/** Data input saat membuat/mengubah transaksi. */
export type TransactionInput = Pick<Transaction, 'amount' | 'type' | 'categoryId' | 'date' | 'note'>

export type ThemePreference = 'light' | 'dark' | 'system'
