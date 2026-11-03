import { useId } from 'react'
import type { Category } from '../../types'
import { CategoryIcon } from './CategoryIcon'

interface CategoryPickerProps {
  categories: readonly Category[]
  value: string
  onChange: (categoryId: string) => void
  label?: string
}

/** Pilihan kategori berbentuk kisi ikon (radio group). */
export function CategoryPicker({ categories, value, onChange, label = 'Kategori' }: CategoryPickerProps) {
  const labelId = useId()
  return (
    <fieldset>
      <legend id={labelId} className="label">
        {label}
      </legend>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-4 gap-2">
        {categories.map((category) => {
          const selected = category.id === value
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-[11px] leading-tight font-medium transition ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="sm" />
              <span className="line-clamp-1 w-full break-all">{category.name}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
