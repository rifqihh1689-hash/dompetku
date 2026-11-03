import { addMonths, currentMonth, formatMonthLabel } from '../lib/date'
import type { MonthKey } from '../types'

interface MonthSelectProps {
  id: string
  value: MonthKey | ''
  onChange: (value: MonthKey | '') => void
  /** Teks pilihan kosong; bila tidak diisi, pilihan kosong tidak ditampilkan. */
  emptyLabel?: string
  /** Jumlah bulan sebelum & sesudah bulan ini. */
  range?: number
}

/** Pemilih bulan berbasis <select> (lebih konsisten daripada input type="month" di semua browser). */
export function MonthSelect({ id, value, onChange, emptyLabel, range = 24 }: MonthSelectProps) {
  const now = currentMonth()
  const months = Array.from({ length: range * 2 + 1 }, (_, i) => addMonths(now, i - range))
  if (value && !months.includes(value)) months.push(value)
  months.sort()
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  )
}
