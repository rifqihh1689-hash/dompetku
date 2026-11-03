import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, currentMonth, formatMonthLabel } from '../lib/date'
import type { MonthKey } from '../types'

interface MonthSwitcherProps {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

/** Pemilih bulan: ‹ November 2026 › */
export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const isCurrent = month === currentMonth()
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex flex-col items-center leading-tight">
        <span className="font-semibold" aria-live="polite">
          {formatMonthLabel(month)}
        </span>
        {!isCurrent && (
          <button type="button" onClick={() => onChange(currentMonth())} className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Kembali ke bulan ini
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
