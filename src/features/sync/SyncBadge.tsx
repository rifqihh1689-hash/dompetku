import { useObservable } from 'dexie-react-hooks'
import { routeHref } from '../../app/router'
import { cloudEnabled, db } from '../../db/db'
import { describeSyncStatus } from './texts'
import { SyncStatusIcon } from './SyncStatusIcon'

/** Ikon status sinkronisasi di header Beranda; ketuk untuk membuka Pengaturan. */
export function SyncBadge() {
  return cloudEnabled ? <SyncBadgeContent /> : null
}

function SyncBadgeContent() {
  const user = useObservable(db.cloud.currentUser)
  const syncState = useObservable(db.cloud.syncState)
  const status = describeSyncStatus(syncState, user)
  return (
    <a
      href={routeHref('pengaturan')}
      title={status.label}
      aria-label={`Sinkronisasi: ${status.label}`}
      className="rounded-full p-2.5 hover:bg-slate-200/60 dark:hover:bg-slate-800"
    >
      <SyncStatusIcon tone={status.tone} size={20} />
    </a>
  )
}
