import { Repeat } from 'lucide-react'
import { formatRupiah } from '../../lib/format'
import type { Category, Transaction } from '../../types'
import { CategoryIcon } from '../categories/CategoryIcon'

interface TransactionItemProps {
  transaction: Transaction
  category: Category
  onSelect?: (transaction: Transaction) => void
  /** Teks kecil di bawah nama (mis. tanggal). */
  meta?: string
}

export function TransactionItem({ transaction, category, onSelect, meta }: TransactionItemProps) {
  const isIncome = transaction.type === 'income'
  const title = transaction.note || category.name
  return (
    <button
      type="button"
      onClick={() => onSelect?.(transaction)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <CategoryIcon icon={category.icon} color={category.color} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {transaction.note ? category.name : (meta ?? (isIncome ? 'Pemasukan' : 'Pengeluaran'))}
          {transaction.note && meta && <> · {meta}</>}
          {transaction.recurringId && <Repeat size={12} aria-label="Transaksi berulang" />}
        </span>
      </span>
      <span className={`shrink-0 font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {isIncome ? '+' : '-'}
        {formatRupiah(transaction.amount)}
      </span>
    </button>
  )
}
