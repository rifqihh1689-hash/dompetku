import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import type { BudgetLevel } from './budget'

/** Warna status (selalu disertai ikon + teks, tidak hanya warna). */
export const LEVEL_STYLES: Record<BudgetLevel, { bar: string; text: string; Icon: typeof CircleCheck; label: string }> = {
  safe: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', Icon: CircleCheck, label: 'Aman' },
  warning: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', Icon: TriangleAlert, label: 'Hampir habis' },
  over: { bar: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-400', Icon: CircleAlert, label: 'Melebihi' },
}
