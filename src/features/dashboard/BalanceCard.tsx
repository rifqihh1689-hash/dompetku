import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatRupiah } from '../../lib/format'
import type { Summary } from './summary'

interface BalanceCardProps {
  summary: Summary
  /** Saldo kumulatif sampai akhir bulan yang dipilih. */
  totalBalance?: number
}

export function BalanceCard({ summary, totalBalance }: BalanceCardProps) {
  return (
    <section
      aria-label="Ringkasan bulan ini"
      className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-700/20"
    >
      <p className="text-sm text-emerald-50/90">Saldo bulan ini</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums" data-testid="saldo-bulan">
        {formatRupiah(summary.balance)}
      </p>
      {totalBalance !== undefined && (
        <p className="mt-1 text-xs text-emerald-50/80">
          Total saldo s.d. bulan ini: <span className="font-semibold tabular-nums">{formatRupiah(totalBalance)}</span>
        </p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/15 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-emerald-50/90">
            <ArrowDownLeft size={14} aria-hidden="true" /> Pemasukan
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums" data-testid="total-pemasukan">
            {formatRupiah(summary.income)}
          </dd>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-emerald-50/90">
            <ArrowUpRight size={14} aria-hidden="true" /> Pengeluaran
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums" data-testid="total-pengeluaran">
            {formatRupiah(summary.expense)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
