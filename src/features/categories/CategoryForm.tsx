import { Check, Trash } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { SegmentedControl } from '../../components/SegmentedControl'
import type { Category, CategoryKind } from '../../types'
import { CategoryIcon } from './CategoryIcon'
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ICON_KEYS } from './icons'
import type { CategoryInput } from './repository'

const KIND_OPTIONS = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'both', label: 'Keduanya' },
] as const satisfies readonly { value: CategoryKind; label: string }[]

interface CategoryFormProps {
  initial?: Category
  onSubmit: (input: CategoryInput) => Promise<void>
  onDelete?: () => void
}

export function CategoryForm({ initial, onSubmit, onDelete }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'tag')
  const [color, setColor] = useState<string>(initial?.color ?? CATEGORY_COLORS[0])
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? 'expense')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const nameId = useId()
  const iconLabelId = useId()
  const colorLabelId = useId()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Nama kategori wajib diisi.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({ name, icon, color, kind })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan kategori.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} size="lg" />
        <div className="flex-1">
          <label htmlFor={nameId} className="label">
            Nama kategori
          </label>
          <input
            id={nameId}
            type="text"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Kopi"
            className="field"
            autoFocus={!initial}
          />
        </div>
      </div>

      <div>
        <span className="label">Dipakai untuk</span>
        <SegmentedControl label="Dipakai untuk" options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </div>

      <div>
        <span id={iconLabelId} className="label">
          Ikon
        </span>
        <div role="radiogroup" aria-labelledby={iconLabelId} className="grid grid-cols-8 gap-1.5">
          {CATEGORY_ICON_KEYS.map((key) => {
            const { Icon, label } = CATEGORY_ICONS[key]
            const selected = key === icon
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={label}
                title={label}
                onClick={() => setIcon(key)}
                className={`flex aspect-square items-center justify-center rounded-lg transition ${
                  selected
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                style={selected ? { backgroundColor: color } : undefined}
              >
                <Icon size={18} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span id={colorLabelId} className="label">
          Warna
        </span>
        <div role="radiogroup" aria-labelledby={colorLabelId} className="grid grid-cols-9 gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={`Warna ${c}`}
              onClick={() => setColor(c)}
              className="flex aspect-square items-center justify-center rounded-full text-white ring-offset-2 transition dark:ring-offset-slate-900"
              style={{ backgroundColor: c, boxShadow: c === color ? `0 0 0 2px ${c}` : undefined }}
            >
              {c === color && <Check size={16} strokeWidth={3} aria-hidden="true" />}
            </button>
          ))}
        </div>
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
          {saving ? 'Menyimpan…' : 'Simpan kategori'}
        </button>
      </div>
    </form>
  )
}
