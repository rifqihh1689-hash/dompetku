import { lazy, Suspense } from 'react'
import { formatDateShort, todayISO } from '../../lib/date'
import { formatRupiah } from '../../lib/format'
import { averageDailyExpense, type DailyPoint } from './summary'

const DailyBars = lazy(() => import('./DailyBars'))

export function DailyTrendCard({ points }: { points: DailyPoint[] }) {
  const average = averageDailyExpense(points, todayISO())
  const peak = points.reduce<DailyPoint | null>((best, p) => (p.expense > (best?.expense ?? 0) ? p : best), null)

  return (
    <section aria-labelledby="tren-title" className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="tren-title" className="font-semibold">
          Pengeluaran harian
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Rata-rata <span className="font-semibold tabular-nums">{formatRupiah(average)}</span>/hari
        </span>
      </div>
      <div
        className="mt-3 h-44 text-slate-500 dark:text-slate-400"
        role="img"
        aria-label={
          peak
            ? `Grafik batang pengeluaran harian. Tertinggi ${formatRupiah(peak.expense)} pada ${formatDateShort(peak.date)}.`
            : 'Grafik batang pengeluaran harian. Belum ada pengeluaran.'
        }
      >
        <Suspense fallback={<div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}>
          <DailyBars points={points} />
        </Suspense>
      </div>
      {peak && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Tertinggi: <span className="font-semibold tabular-nums">{formatRupiah(peak.expense)}</span> pada {formatDateShort(peak.date)}
        </p>
      )}
    </section>
  )
}
