import { CATEGORY_ICONS } from './icons'

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { box: 'h-8 w-8', icon: 16 },
  md: { box: 'h-10 w-10', icon: 20 },
  lg: { box: 'h-12 w-12', icon: 24 },
} as const

/** Ikon kategori di dalam lingkaran berwarna. */
export function CategoryIcon({ icon, color, size = 'md', className = '' }: CategoryIconProps) {
  const { Icon } = CATEGORY_ICONS[icon] ?? CATEGORY_ICONS.ellipsis
  const s = SIZES[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${s.box} ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden="true"
    >
      <Icon size={s.icon} strokeWidth={2.2} />
    </span>
  )
}
