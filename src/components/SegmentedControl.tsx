interface Option<T extends string> {
  value: T
  label: string
  activeClassName?: string
}

interface SegmentedControlProps<T extends string> {
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

/** Tombol pilihan berdampingan (radio group). */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active
                ? (option.activeClassName ?? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white')
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
