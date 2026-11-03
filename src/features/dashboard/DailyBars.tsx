import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { formatDateLong } from '../../lib/date'
import { formatCompactRupiah, formatRupiah } from '../../lib/format'
import { ChartTooltipBox } from './ChartTooltip'
import type { DailyPoint } from './summary'

function DayTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as DailyPoint | undefined
  if (!active || !point) return null
  return <ChartTooltipBox title={formatDateLong(point.date)}>Pengeluaran {formatRupiah(point.expense)}</ChartTooltipBox>
}

/** Grafik batang pengeluaran harian dalam satu bulan. */
export default function DailyBars({ points }: { points: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fill: 'currentColor', fontSize: 11 }}
          tickFormatter={(day: number) => (day === 1 || day % 5 === 0 ? String(day) : '')}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={54}
          allowDecimals={false}
          tick={{ fill: 'currentColor', fontSize: 11 }}
          tickFormatter={(v: number) => formatCompactRupiah(v).replace(' ', '\u00a0')}
        />
        <Tooltip content={DayTooltip} cursor={{ fill: 'currentColor', fillOpacity: 0.08 }} />
        <Bar dataKey="expense" name="Pengeluaran" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
