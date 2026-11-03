import type { ReactNode } from 'react'

/** Kotak tooltip grafik bergaya seragam. */
export function ChartTooltipBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-0.5 font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <div className="text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  )
}
