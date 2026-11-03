import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Repeat } from 'lucide-react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { useCategories, useCategoryLookup } from '../../db/hooks'
import { formatDateShort, formatMonthLabel, todayISO } from '../../lib/date'
import { formatRupiah } from '../../lib/format'
import type { RecurringRule } from '../../types'
import { CategoryIcon } from '../categories/CategoryIcon'
import { monthlyRecurringTotals, nextOccurrence } from './recurring'
import { RecurringForm } from './RecurringForm'
import {
  addRecurringRule,
  deleteRecurringRule,
  generateRecurringTransactions,
  setRecurringActive,
  updateRecurringRule,
  type RecurringInput,
} from './repository'

function describeRule(rule: RecurringRule, today: string): string {
  if (!rule.active) return 'Dijeda'
  const next = nextOccurrence(rule, today)
  if (!next) return `Berakhir ${rule.endMonth ? formatMonthLabel(rule.endMonth) : ''}`.trim()
  const year = next.slice(0, 4) === today.slice(0, 4) ? '' : ` ${next.slice(0, 4)}`
  return `Berikutnya ${formatDateShort(next)}${year}`
}

export function RecurringPage() {
  const rules = useLiveQuery(() => db.recurring.orderBy('id').toArray().then((list) => list.sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.createdAt - b.createdAt)), [])
  const categories = useCategories() ?? []
  const getCategory = useCategoryLookup()
  const [editing, setEditing] = useState<RecurringRule | 'new' | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const today = todayISO()
  const totals = monthlyRecurringTotals(rules ?? [])

  const afterChange = async () => {
    const added = await generateRecurringTransactions()
    if (added > 0) toast({ message: `${added} transaksi berulang yang sudah jatuh tempo ditambahkan.`, tone: 'info' })
  }

  const handleSubmit = async (input: RecurringInput) => {
    if (editing === 'new') {
      await addRecurringRule(input)
      toast({ message: 'Transaksi berulang ditambahkan.' })
    } else if (editing) {
      await updateRecurringRule(editing.id, input)
      toast({ message: 'Transaksi berulang diperbarui.' })
    }
    setEditing(null)
    await afterChange()
  }

  const handleDelete = async (rule: RecurringRule) => {
    const ok = await confirm({
      title: 'Hapus transaksi berulang?',
      message: 'Transaksi tidak akan dibuat lagi di bulan berikutnya. Transaksi yang sudah tercatat tetap ada di riwayat.',
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    await deleteRecurringRule(rule.id)
    setEditing(null)
    toast({ message: 'Transaksi berulang dihapus.', tone: 'info' })
  }

  const toggle = async (rule: RecurringRule) => {
    await setRecurringActive(rule.id, !rule.active)
    if (!rule.active) await afterChange()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Berulang"
        subtitle="Tagihan & pemasukan rutin bulanan"
        actions={
          <button type="button" className="btn-secondary px-3 py-2" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden="true" /> Tambah
          </button>
        }
      />

      {rules && rules.length > 0 && (
        <dl className="grid grid-cols-2 gap-3">
          <div className="card p-3">
            <dt className="text-xs text-slate-500 dark:text-slate-400">Pemasukan rutin / bulan</dt>
            <dd className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">{formatRupiah(totals.income)}</dd>
          </div>
          <div className="card p-3">
            <dt className="text-xs text-slate-500 dark:text-slate-400">Pengeluaran rutin / bulan</dt>
            <dd className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">{formatRupiah(totals.expense)}</dd>
          </div>
        </dl>
      )}

      {rules && rules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Repeat}
            title="Belum ada transaksi berulang"
            description="Catat tagihan bulanan (listrik, internet, kos) atau gaji sekali saja — Dompetku akan mencatatnya otomatis setiap bulan."
            action={
              <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
                <Plus size={16} aria-hidden="true" /> Tambah transaksi berulang
              </button>
            }
          />
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {(rules ?? []).map((rule) => {
            const category = getCategory(rule.categoryId)
            const isIncome = rule.type === 'income'
            return (
              <li key={rule.id} className={`flex items-center gap-3 px-4 py-3 ${rule.active ? '' : 'opacity-60'}`}>
                <button type="button" onClick={() => setEditing(rule)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{rule.note || category.name}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      Tgl {rule.dayOfMonth} · {describeRule(rule, today)}
                    </span>
                    <span className={`block text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isIncome ? '+' : '-'}
                      {formatRupiah(rule.amount)}
                    </span>
                  </span>
                </button>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    className="peer sr-only"
                    checked={rule.active}
                    onChange={() => void toggle(rule)}
                    aria-label={`${rule.active ? 'Jeda' : 'Aktifkan'} ${rule.note || category.name}`}
                  />
                  <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/50 dark:bg-slate-700" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? 'Transaksi Berulang Baru' : 'Ubah Transaksi Berulang'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <RecurringForm
            key={editing === 'new' ? 'new' : editing.id}
            categories={categories}
            initial={editing === 'new' ? undefined : editing}
            onSubmit={handleSubmit}
            onDelete={editing === 'new' ? undefined : () => void handleDelete(editing)}
          />
        )}
      </Modal>
    </div>
  )
}
