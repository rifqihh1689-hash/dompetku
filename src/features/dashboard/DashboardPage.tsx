import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { routeHref } from '../../app/router'
import { EmptyState } from '../../components/EmptyState'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { PageHeader } from '../../components/PageHeader'
import { db } from '../../db/db'
import { useCategoryLookup, useTransactions } from '../../db/hooks'
import type { MonthKey } from '../../types'
import { useTransactionEditor } from '../transactions/editor-context'
import { TransactionItem } from '../transactions/TransactionItem'
import { formatDateShort } from '../../lib/date'
import { BudgetAlerts } from '../budget/BudgetAlerts'
import { ThemeToggle } from '../settings/ThemeToggle'
import { BalanceCard } from './BalanceCard'
import { CategoryBreakdown } from './CategoryBreakdown'
import { DailyTrendCard } from './DailyTrendCard'
import { dailyTrend, expenseByCategory, summarize } from './summary'

interface DashboardPageProps {
  month: MonthKey
  onMonthChange: (month: MonthKey) => void
}

export function DashboardPage({ month, onMonthChange }: DashboardPageProps) {
  const transactions = useTransactions(month)
  const getCategory = useCategoryLookup()
  const { openNew, openEdit } = useTransactionEditor()

  // Saldo kumulatif dari awal sampai akhir bulan terpilih.
  const totalBalance = useLiveQuery(async () => {
    let total = 0
    await db.transactions
      .where('date')
      .belowOrEqual(`${month}-31`)
      .each((tx) => {
        total += tx.type === 'income' ? tx.amount : -tx.amount
      })
    return total
  }, [month])

  const list = useMemo(() => transactions ?? [], [transactions])
  const summary = useMemo(() => summarize(list), [list])
  const slices = useMemo(() => expenseByCategory(list, getCategory), [list, getCategory])
  const points = useMemo(() => dailyTrend(list, month), [list, month])

  return (
    <div className="space-y-4">
      <PageHeader title="Dompetku" subtitle="Ringkasan keuangan bulanan" actions={<ThemeToggle />} />
      <MonthSwitcher month={month} onChange={onMonthChange} />
      <BalanceCard summary={summary} totalBalance={totalBalance} />
      <BudgetAlerts month={month} />

      <CategoryBreakdown slices={slices} total={summary.expense} />
      <DailyTrendCard points={points} />

      <section aria-labelledby="terbaru-title" className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 id="terbaru-title" className="font-semibold">
            Transaksi terbaru
          </h2>
          <a href={routeHref('riwayat')} className="inline-flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Lihat semua <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
        {transactions && list.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Belum ada transaksi bulan ini"
            description="Ketuk tombol + untuk mencatat pemasukan atau pengeluaran."
            action={
              <button type="button" className="btn-primary" onClick={() => openNew()}>
                Tambah transaksi
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.slice(0, 5).map((tx) => (
              <li key={tx.id}>
                <TransactionItem
                  transaction={tx}
                  category={getCategory(tx.categoryId)}
                  onSelect={openEdit}
                  meta={formatDateShort(tx.date)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
