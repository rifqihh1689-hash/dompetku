import { useLiveQuery } from 'dexie-react-hooks'
import { ReceiptText, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { db } from '../../db/db'
import { useCategories, useCategoryLookup, useTransactions } from '../../db/hooks'
import { currentMonth, formatMonthLabel, monthOf } from '../../lib/date'
import { formatRupiah } from '../../lib/format'
import type { TransactionType } from '../../types'
import { useTransactionEditor } from './editor-context'
import { EMPTY_FILTER, filterTransactions, isFilterActive, type TransactionFilter } from './filters'
import { TransactionList } from './TransactionList'

const PAGE_SIZE = 100

export function HistoryPage() {
  const [filter, setFilter] = useState<TransactionFilter>(EMPTY_FILTER)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const ids = { search: useId(), month: useId(), category: useId(), type: useId() }

  const transactions = useTransactions(filter.month === 'all' ? null : filter.month)
  const categories = useCategories() ?? []
  const getCategory = useCategoryLookup()
  const { openNew } = useTransactionEditor()

  const months = useLiveQuery(async () => {
    const dates = (await db.transactions.orderBy('date').uniqueKeys()) as string[]
    const set = new Set(dates.map(monthOf))
    set.add(currentMonth())
    return [...set].sort().reverse()
  }, [])

  const filtered = useMemo(
    () => (transactions ? filterTransactions(transactions, filter, getCategory) : []),
    [transactions, filter, getCategory],
  )
  const totals = useMemo(
    () => filtered.reduce((acc, tx) => ({ ...acc, [tx.type]: acc[tx.type] + tx.amount }), { income: 0, expense: 0 }),
    [filtered],
  )

  const update = (patch: Partial<TransactionFilter>) => {
    setFilter((f) => ({ ...f, ...patch }))
    setLimit(PAGE_SIZE)
  }
  const active = isFilterActive(filter)

  return (
    <div className="space-y-4">
      <PageHeader title="Riwayat" subtitle="Cari dan saring transaksi" />

      <div className="space-y-2">
        <label htmlFor={ids.search} className="sr-only">
          Cari transaksi
        </label>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id={ids.search}
            type="search"
            value={filter.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Cari catatan, kategori, atau nominal"
            className="field pl-10"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor={ids.month} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Bulan
            </label>
            <select id={ids.month} value={filter.month} onChange={(e) => update({ month: e.target.value })} className="field px-2 text-sm">
              <option value="all">Semua</option>
              {(months ?? []).map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ids.category} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Kategori
            </label>
            <select id={ids.category} value={filter.categoryId} onChange={(e) => update({ categoryId: e.target.value })} className="field px-2 text-sm">
              <option value="all">Semua</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ids.type} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Jenis
            </label>
            <select
              id={ids.type}
              value={filter.type}
              onChange={(e) => update({ type: e.target.value as TransactionType | 'all' })}
              className="field px-2 text-sm"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
        </div>
      </div>

      {transactions && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> transaksi ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400">+{formatRupiah(totals.income)}</span> ·{' '}
            <span className="text-rose-600 dark:text-rose-400">-{formatRupiah(totals.expense)}</span>
          </p>
          {active && (
            <button type="button" onClick={() => update(EMPTY_FILTER)} className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <X size={14} aria-hidden="true" /> Hapus filter
            </button>
          )}
        </div>
      )}

      {transactions && filtered.length === 0 ? (
        <div className="card">
          {active ? (
            <EmptyState icon={Search} title="Tidak ada hasil" description="Coba ubah kata kunci atau filter." />
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="Belum ada transaksi"
              description="Catat pemasukan atau pengeluaran pertamamu."
              action={
                <button type="button" className="btn-primary" onClick={() => openNew()}>
                  Tambah transaksi
                </button>
              }
            />
          )}
        </div>
      ) : (
        <>
          <TransactionList transactions={filtered.slice(0, limit)} getCategory={getCategory} />
          {filtered.length > limit && (
            <button type="button" onClick={() => setLimit((l) => l + PAGE_SIZE)} className="btn-secondary w-full">
              Tampilkan lebih banyak ({filtered.length - limit} lagi)
            </button>
          )}
        </>
      )}
    </div>
  )
}
