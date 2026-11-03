import { Cloud, CloudAlert, CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
import type { SyncTone } from './texts'

const ICONS: Record<SyncTone, { Icon: typeof Cloud; className: string }> = {
  ok: { Icon: CloudCheck, className: 'text-emerald-600 dark:text-emerald-400' },
  busy: { Icon: RefreshCw, className: 'animate-spin text-sky-600 dark:text-sky-400 [animation-duration:1.6s]' },
  offline: { Icon: CloudOff, className: 'text-slate-500 dark:text-slate-400' },
  error: { Icon: CloudAlert, className: 'text-rose-600 dark:text-rose-400' },
  idle: { Icon: Cloud, className: 'text-slate-400 dark:text-slate-500' },
}

export function SyncStatusIcon({ tone, size = 18 }: { tone: SyncTone; size?: number }) {
  const { Icon, className } = ICONS[tone]
  return <Icon size={size} className={className} aria-hidden="true" />
}
