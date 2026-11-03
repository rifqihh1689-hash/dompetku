import { Trash } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { AmountInput } from '../../components/AmountInput'
import { formatThousands, parseAmount } from '../../lib/format'
import type { Category } from '../../types'

interface BudgetFormProps {
  /** Kategori yang bisa dipilih (untuk anggaran baru). */
  categories: readonly Category[]
  initialCategoryId?: string
  initialAmount?: number
  /** Kategori terkunci saat mengubah anggaran. */
  lockCategory?: boolean
  onSubmit: (categoryId: string, amount: number) => Promise<void>
  onDelete?: () => void
}

export function BudgetForm({ categories, initialCategoryId, initialAmount, lockCategory, onSubmit, onDelete }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? categories[0]?.id ?? '')
  const [amountText, setAmountText] = useState(initialAmount ? formatThousands(initialAmount) : '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const categoryFieldId = useId()
  const amountId = useId()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const amount = parseAmount(amountText)
    if (!categoryId) return setError('Pilih kategori terlebih dahulu.')
    if (amount <= 0) return setError('Jumlah anggaran harus lebih dari 0.')
    setSaving(true)
    try {
      await onSubmit(categoryId, amount)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan anggaran.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={categoryFieldId} className="label">
          Kategori
        </label>
        <select
          id={categoryFieldId}
          value={categoryId}
          disabled={lockCategory}
          onChange={(e) => setCategoryId(e.target.value)}
          className="field disabled:opacity-70"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={amountId} className="label">
          Batas anggaran per bulan
        </label>
        <AmountInput id={amountId} value={amountText} onChange={setAmountText} large autoFocus />
      </div>
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
          {saving ? 'Menyimpan…' : 'Simpan anggaran'}
        </button>
      </div>
    </form>
  )
}
