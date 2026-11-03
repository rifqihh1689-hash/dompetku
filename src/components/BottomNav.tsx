import { House, ReceiptText, Repeat, Settings, Target, type LucideIcon } from 'lucide-react'
import { routeHref, type Route } from '../app/router'

const ITEMS: { route: Route; label: string; Icon: LucideIcon }[] = [
  { route: 'beranda', label: 'Beranda', Icon: House },
  { route: 'riwayat', label: 'Riwayat', Icon: ReceiptText },
  { route: 'anggaran', label: 'Anggaran', Icon: Target },
  { route: 'berulang', label: 'Berulang', Icon: Repeat },
  { route: 'pengaturan', label: 'Pengaturan', Icon: Settings },
]

export function BottomNav({ active }: { active: Route }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map(({ route, label, Icon }) => {
          const isActive = route === active
          return (
            <li key={route}>
              <a
                href={routeHref(route)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
