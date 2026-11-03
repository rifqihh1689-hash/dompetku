import { Trash } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { AmountInput } from '../../components/AmountInput'
import { SegmentedControl } from '../../components/SegmentedControl'
import { todayISO } from '../../lib/date'
import { formatThousands, parseAmount } from '../../lib/format'
import type { Category, Transaction, TransactionInput, TransactionType } from '../../types'
import { CategoryPicker } from '../categories/CategoryPicker'
import { categoryMatchesType } from '../categories/repository'
import { TYPE_OPTIONS } from './constants'
import { validateTransactionInput } from './repository'

interface TransactionFormProps {
  categories: readonly Category[]
  /** Transaksi yang diubah; kosong berarti transaksi baru. */
  initial?: Transaction
  defaults?: Partial<TransactionInput>
  onSubmit: (input: TransactionInput) => Promise<void>
  onDelete?: () => void
  submitLabel?: string
}

export function TransactionForm({ categories, initial, defaults, onSubmit, onDelete, submitLabel = 'Simpan' }: TransactionFormProps) {
  const start = { ...defaults, ...initial }
  const [type, setType] = useState<TransactionType>(start.type ?? 'expense')
  const [amountText, setAmountText] = useState(start.amount ? formatThousands(start.amount) : '')
  const [categoryId, setCategoryId] = useState(start.categoryId ?? '')
  const [date, setDate] = useState(start.date ?? todayISO())
  const [note, setNote] = useState(start.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const ids = { amount: useId(), date: useId(), note: useId(), error: useId() }

  const available = categories.filter((c) => categoryMatchesType(c, type))

  const changeType = (next: TransactionType) => {
    setType(next)
    const current = categories.find((c) => c.id === categoryId)
    if (current && !categoryMatchesType(current, next)) setCategoryId('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const input: TransactionInput = { type, amount: parseAmount(amountText), categoryId, date, note: note.trim() }
    const message = validateTransactionInput(input)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan transaksi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SegmentedControl label="Jenis transaksi" options={TYPE_OPTIONS} value={type} onChange={changeType} />

      <div>
        <label htmlFor={ids.amount} className="label">
          Jumlah
        </label>
        <AmountInput
          id={ids.amount}
          value={amountText}
          onChange={setAmountText}
          large
          autoFocus={!initial}
          invalid={error !== null && parseAmount(amountText) <= 0}
          describedBy={error ? ids.error : undefined}
        />
      </div>

      <CategoryPicker categories={available} value={categoryId} onChange={setCategoryId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.date} className="label">
            Tanggal
          </label>
          <input id={ids.date} type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor={ids.note} className="label">
            Catatan <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <input
            id={ids.note}
            type="text"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Makan siang"
            className="field"
          />
        </div>
      </div>

      {error && (
        <p
          id={ids.error}
          role="alert"
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-ghost-danger" aria-label="Hapus transaksi">
            <Trash size={18} aria-hidden="true" />
            Hapus
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-base">
          {saving ? 'Menyimpan…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
