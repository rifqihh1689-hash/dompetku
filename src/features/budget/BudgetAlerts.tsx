import { ChevronRight } from 'lucide-react'
import { routeHref } from '../../app/router'
import { formatRupiah } from '../../lib/format'
import type { MonthKey } from '../../types'
import { budgetAlerts, budgetMessage } from './budget'
import { LEVEL_STYLES } from './levels'
import { useBudgetUsage } from './hooks'

/** Daftar peringatan anggaran (≥ 80% / melebihi) untuk ditampilkan di Beranda. */
export function BudgetAlerts({ month }: { month: MonthKey }) {
  const usages = useBudgetUsage(month)
  const alerts = budgetAlerts(usages ?? [])
  if (alerts.length === 0) return null

  return (
    <section aria-label="Peringatan anggaran" className="space-y-2">
      {alerts.map((usage) => {
        const { Icon } = LEVEL_STYLES[usage.level]
        const over = usage.level === 'over'
        return (
          <a
            key={usage.budget.id}
            href={routeHref('anggaran')}
            role="alert"
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              over
                ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="flex-1 font-medium">{budgetMessage(usage, formatRupiah)}</span>
            <ChevronRight size={16} className="shrink-0 opacity-60" aria-hidden="true" />
          </a>
        )
      })}
    </section>
  )
}
