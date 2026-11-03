import { Trash } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { AmountInput } from '../../components/AmountInput'
import { MonthSelect } from '../../components/MonthSelect'
import { SegmentedControl } from '../../components/SegmentedControl'
import { currentMonth } from '../../lib/date'
import { formatThousands, parseAmount } from '../../lib/format'
import type { Category, RecurringRule, TransactionType } from '../../types'
import { CategoryPicker } from '../categories/CategoryPicker'
import { categoryMatchesType } from '../categories/repository'
import { TYPE_OPTIONS } from '../transactions/constants'
import { validateRecurringInput, type RecurringInput } from './repository'

interface RecurringFormProps {
  categories: readonly Category[]
  initial?: RecurringRule
  onSubmit: (input: RecurringInput) => Promise<void>
  onDelete?: () => void
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function RecurringForm({ categories, initial, onSubmit, onDelete }: RecurringFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amountText, setAmountText] = useState(initial ? formatThousands(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [dayOfMonth, setDayOfMonth] = useState(() => initial?.dayOfMonth ?? new Date().getDate())
  const [startMonth, setStartMonth] = useState(initial?.startMonth ?? currentMonth())
  const [endMonth, setEndMonth] = useState(initial?.endMonth ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const ids = { amount: useId(), note: useId(), day: useId(), start: useId(), end: useId() }

  const changeType = (next: TransactionType) => {
    setType(next)
    const current = categories.find((c) => c.id === categoryId)
    if (current && !categoryMatchesType(current, next)) setCategoryId('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const input: RecurringInput = {
      type,
      amount: parseAmount(amountText),
      categoryId,
      note: note.trim(),
      dayOfMonth,
      startMonth,
      endMonth: endMonth || undefined,
    }
    const message = validateRecurringInput(input)
    if (message) return setError(message)
    setSaving(true)
    try {
      await onSubmit(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SegmentedControl label="Jenis transaksi" options={TYPE_OPTIONS} value={type} onChange={changeType} />
      <div>
        <label htmlFor={ids.note} className="label">
          Nama / catatan
        </label>
        <input
          id={ids.note}
          type="text"
          maxLength={120}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="mis. Listrik PLN, Netflix, Gaji"
          className="field"
          autoFocus={!initial}
        />
      </div>
      <div>
        <label htmlFor={ids.amount} className="label">
          Jumlah per bulan
        </label>
        <AmountInput id={ids.amount} value={amountText} onChange={setAmountText} large />
      </div>
      <CategoryPicker categories={categories.filter((c) => categoryMatchesType(c, type))} value={categoryId} onChange={setCategoryId} />
      <div>
        <label htmlFor={ids.day} className="label">
          Tanggal setiap bulan
        </label>
        <select id={ids.day} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="field">
          {DAYS.map((d) => (
            <option key={d} value={d}>
              Tanggal {d}
            </option>
          ))}
        </select>
        {dayOfMonth > 28 && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pada bulan yang lebih pendek, dipakai tanggal terakhir bulan itu.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={ids.start} className="label">
            Mulai bulan
          </label>
          <MonthSelect id={ids.start} value={startMonth} onChange={(v) => v && setStartMonth(v)} />
        </div>
        <div>
          <label htmlFor={ids.end} className="label">
            Berakhir <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <MonthSelect id={ids.end} value={endMonth} onChange={setEndMonth} emptyLabel="Tidak berakhir" range={60} />
        </div>
      </div>
      <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Transaksi dibuat otomatis setiap bulan pada tanggal jatuh tempo — termasuk bulan-bulan yang terlewat saat aplikasi tidak dibuka.
      </p>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-ghost-danger">
            <Trash size={18} aria-hidden="true" /> Hapus
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
