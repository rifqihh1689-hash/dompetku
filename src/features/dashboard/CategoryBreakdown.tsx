import { ChartPie } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { formatPercent, formatRupiah } from '../../lib/format'
import { CategoryIcon } from '../categories/CategoryIcon'
import { limitSlices, type CategorySlice } from './summary'

const ExpenseDonut = lazy(() => import('./ExpenseDonut'))

interface CategoryBreakdownProps {
  slices: CategorySlice[]
  total: number
}

/** Kartu pengeluaran per kategori: grafik donat + daftar berperingkat (juga berfungsi sebagai tabel data). */
export function CategoryBreakdown({ slices, total }: CategoryBreakdownProps) {
  return (
    <section aria-labelledby="kategori-chart-title" className="card p-4">
      <h2 id="kategori-chart-title" className="font-semibold">
        Pengeluaran per kategori
      </h2>
      {slices.length === 0 ? (
        <EmptyState icon={ChartPie} title="Belum ada pengeluaran" description="Grafik akan muncul setelah kamu mencatat pengeluaran." />
      ) : (
        <>
          <div
            className="relative mx-auto my-4 h-48 w-48"
            role="img"
            aria-label={`Grafik lingkaran pengeluaran per kategori, total ${formatRupiah(total)}`}
          >
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />}>
              <ExpenseDonut slices={limitSlices(slices)} />
            </Suspense>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-sm font-bold tabular-nums">{formatRupiah(total)}</span>
            </div>
          </div>
          <ul className="space-y-3" aria-label="Rincian pengeluaran per kategori">
            {slices.map((slice) => (
              <li key={slice.categoryId} className="flex items-center gap-3">
                <CategoryIcon icon={slice.icon} color={slice.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{slice.name}</span>
                    <span className="shrink-0 tabular-nums">{formatRupiah(slice.total)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(slice.ratio * 100, 1)}%`, backgroundColor: slice.color }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {formatPercent(slice.ratio)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
