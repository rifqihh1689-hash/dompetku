import { formatAmountInput } from '../lib/format'

interface AmountInputProps {
  id: string
  value: string
  onChange: (formatted: string) => void
  autoFocus?: boolean
  large?: boolean
  invalid?: boolean
  describedBy?: string
}

/** Input nominal Rupiah; otomatis diberi pemisah ribuan saat diketik. */
export function AmountInput({ id, value, onChange, autoFocus, large, invalid, describedBy }: AmountInputProps) {
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-slate-400 ${large ? 'text-xl' : 'text-base'}`}
        aria-hidden="true"
      >
        Rp
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        autoFocus={autoFocus}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        className={`field tabular-nums ${large ? 'py-3 pl-12 text-2xl font-bold' : 'pl-10'} ${invalid ? 'border-rose-500' : ''}`}
      />
    </div>
  )
}
