import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { MonthSwitcher } from '../../components/MonthSwitcher'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { useCategories } from '../../db/hooks'
import { addMonths, formatMonthLabel } from '../../lib/date'
import { formatPercent, formatRupiah } from '../../lib/format'
import type { MonthKey } from '../../types'
import { CategoryIcon } from '../categories/CategoryIcon'
import { categoryMatchesType } from '../categories/repository'
import { budgetMessage, totalBudget, type BudgetUsage } from './budget'
import { BudgetForm } from './BudgetForm'
import { BudgetProgress, LevelBadge } from './BudgetStatus'
import { useBudgetUsage } from './hooks'
import { copyBudgets, deleteBudget, setBudget } from './repository'

interface BudgetPageProps {
  month: MonthKey
  onMonthChange: (month: MonthKey) => void
}

export function BudgetPage({ month, onMonthChange }: BudgetPageProps) {
  const usages = useBudgetUsage(month)
  const categories = useCategories() ?? []
  const [editing, setEditing] = useState<BudgetUsage | 'new' | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const previousMonth = addMonths(month, -1)
  const previousCount = useLiveQuery(() => db.budgets.where('month').equals(previousMonth).count(), [previousMonth])

  const budgeted = new Set((usages ?? []).map((u) => u.budget.categoryId))
  const available = categories.filter((c) => categoryMatchesType(c, 'expense') && !budgeted.has(c.id))
  const totals = totalBudget(usages ?? [])

  const handleCopy = async () => {
    const count = await copyBudgets(previousMonth, month)
    toast({
      message: count > 0 ? `${count} anggaran disalin dari ${formatMonthLabel(previousMonth)}.` : 'Tidak ada anggaran baru untuk disalin.',
      tone: 'info',
    })
  }

  const handleSubmit = async (categoryId: string, amount: number) => {
    await setBudget(month, categoryId, amount)
    toast({ message: 'Anggaran disimpan.' })
    setEditing(null)
  }

  const handleDelete = async (usage: BudgetUsage) => {
    const ok = await confirm({
      title: 'Hapus anggaran?',
      message: `Anggaran ${usage.category.name} untuk ${formatMonthLabel(month)} akan dihapus. Transaksi tidak terpengaruh.`,
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    await deleteBudget(usage.budget.id)
    setEditing(null)
    toast({ message: 'Anggaran dihapus.', tone: 'info' })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anggaran"
        subtitle="Batas pengeluaran per kategori"
        actions={
          available.length > 0 && (
            <button type="button" className="btn-secondary px-3 py-2" onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden="true" /> Tambah
            </button>
          )
        }
      />
      <MonthSwitcher month={month} onChange={onMonthChange} />

      {usages && usages.length > 0 && (
        <section aria-label="Total anggaran" className="card space-y-3 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total terpakai</span>
            <LevelBadge level={totals.level} text={formatPercent(totals.ratio)} />
          </div>
          <p className="text-xl font-bold tabular-nums">
            {formatRupiah(totals.spent)}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">dari {formatRupiah(totals.limit)}</span>
          </p>
          <BudgetProgress ratio={totals.ratio} level={totals.level} label="Total pemakaian anggaran" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totals.remaining >= 0 ? 'Sisa' : 'Lebih'}{' '}
            <span className="font-semibold tabular-nums">{formatRupiah(Math.abs(totals.remaining))}</span>
          </p>
        </section>
      )}

      {usages && usages.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="Belum ada anggaran"
            description="Tetapkan batas pengeluaran per kategori. Kamu akan diingatkan saat pemakaian melewati 80% dan 100%."
            action={
              <div className="flex flex-col gap-2">
                <button type="button" className="btn-primary" onClick={() => setEditing('new')} disabled={available.length === 0}>
                  <Plus size={16} aria-hidden="true" /> Tambah anggaran
                </button>
                {!!previousCount && (
                  <button type="button" className="btn-secondary" onClick={handleCopy}>
                    <Copy size={16} aria-hidden="true" /> Salin dari {formatMonthLabel(previousMonth)}
                  </button>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {(usages ?? []).map((usage) => (
            <li key={usage.budget.id}>
              <button
                type="button"
                onClick={() => setEditing(usage)}
                className="card block w-full space-y-2 p-4 text-left transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={usage.category.icon} color={usage.category.color} size="sm" />
                  <span className="flex-1 font-medium">{usage.category.name}</span>
                  <span className="text-sm tabular-nums">
                    <span className="font-semibold">{formatRupiah(usage.spent)}</span>
                    <span className="text-slate-500 dark:text-slate-400"> / {formatRupiah(usage.budget.amount)}</span>
                  </span>
                </div>
                <BudgetProgress ratio={usage.ratio} level={usage.level} label={`Pemakaian anggaran ${usage.category.name}`} />
                <div className="flex items-center justify-between gap-2">
                  <LevelBadge level={usage.level} text={usage.level === 'safe' ? budgetMessage(usage, formatRupiah) : undefined} />
                  <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{formatPercent(usage.ratio)}</span>
                </div>
                {usage.level !== 'safe' && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{budgetMessage(usage, formatRupiah)}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? 'Anggaran Baru' : 'Ubah Anggaran'} onClose={() => setEditing(null)}>
        {editing === 'new' && <BudgetForm categories={available} onSubmit={handleSubmit} />}
        {editing !== null && editing !== 'new' && (
          <BudgetForm
            categories={[editing.category]}
            initialCategoryId={editing.budget.categoryId}
            initialAmount={editing.budget.amount}
            lockCategory
            onSubmit={handleSubmit}
            onDelete={() => void handleDelete(editing)}
          />
        )}
      </Modal>
    </div>
  )
}
