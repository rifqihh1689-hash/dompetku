import { Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'
import { formatPercent, formatRupiah } from '../../lib/format'
import { ChartTooltipBox } from './ChartTooltip'
import type { CategorySlice } from './summary'

function SliceTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as CategorySlice | undefined
  if (!active || !slice) return null
  return (
    <ChartTooltipBox title={slice.name}>
      {formatRupiah(slice.total)} · {formatPercent(slice.ratio)}
    </ChartTooltipBox>
  )
}

/** Grafik donat pengeluaran per kategori. Dimuat terpisah (lazy) agar halaman awal ringan. */
export default function ExpenseDonut({ slices }: { slices: CategorySlice[] }) {
  const data = slices.map((s) => ({ ...s, fill: s.color }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          innerRadius="62%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="var(--chart-surface)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Tooltip content={SliceTooltip} />
      </PieChart>
    </ResponsiveContainer>
  )
}
