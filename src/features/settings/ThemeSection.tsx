import { SegmentedControl } from '../../components/SegmentedControl'
import type { ThemePreference } from '../../types'
import { useThemeContext } from './theme-context'

const OPTIONS = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Ikuti sistem' },
] as const satisfies readonly { value: ThemePreference; label: string }[]

export function ThemeSection() {
  const [theme, setTheme] = useThemeContext()
  return (
    <section aria-labelledby="tema-title" className="card space-y-3 p-4">
      <h2 id="tema-title" className="font-semibold">
        Tampilan
      </h2>
      <SegmentedControl label="Tema" options={OPTIONS} value={theme} onChange={setTheme} />
    </section>
  )
}
