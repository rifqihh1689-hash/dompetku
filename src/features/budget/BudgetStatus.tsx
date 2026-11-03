import type { BudgetLevel } from './budget'
import { LEVEL_STYLES } from './levels'

interface ProgressBarProps {
  ratio: number
  level: BudgetLevel
  label: string
}

/** Progress bar pemakaian anggaran. Garis penanda di 80%. */
export function BudgetProgress({ ratio, level, label }: ProgressBarProps) {
  const pct = Math.round(ratio * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(pct, 100)}
      aria-valuetext={`${pct}% terpakai`}
      className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
    >
      <div className={`h-full rounded-full transition-all ${LEVEL_STYLES[level].bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      <div className="absolute inset-y-0 left-[80%] w-0.5 bg-white/80 dark:bg-slate-950/70" aria-hidden="true" />
    </div>
  )
}

export function LevelBadge({ level, text }: { level: BudgetLevel; text?: string }) {
  const { Icon, label, text: color } = LEVEL_STYLES[level]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={14} aria-hidden="true" />
      {text ?? label}
    </span>
  )
}
