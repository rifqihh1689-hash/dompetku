import { Moon, Sun } from 'lucide-react'
import { resolveTheme } from './theme'
import { useThemeContext } from './theme-context'

/** Tombol cepat beralih antara mode terang & gelap. */
export function ThemeToggle() {
  const [theme, setTheme] = useThemeContext()
  const isDark = resolveTheme(theme) === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
      className="rounded-full p-2.5 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  )
}
