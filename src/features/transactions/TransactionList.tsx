import { formatDateLong } from '../../lib/date'
import { formatRupiah } from '../../lib/format'
import type { Category, Transaction } from '../../types'
import { useTransactionEditor } from './editor-context'
import { groupByDate } from './filters'
import { TransactionItem } from './TransactionItem'

interface TransactionListProps {
  transactions: readonly Transaction[]
  getCategory: (id: string) => Category
}

/** Daftar transaksi dikelompokkan per tanggal, dengan subtotal harian. */
export function TransactionList({ transactions, getCategory }: TransactionListProps) {
  const { openEdit } = useTransactionEditor()
  const groups = groupByDate(transactions)

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const net = group.income - group.expense
        return (
          <section key={group.date} aria-label={formatDateLong(group.date)} className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>{formatDateLong(group.date)}</span>
              <span className="tabular-nums">{formatRupiah(net)}</span>
            </header>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.transactions.map((tx) => (
                <li key={tx.id}>
                  <TransactionItem transaction={tx} category={getCategory(tx.categoryId)} onSelect={openEdit} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
