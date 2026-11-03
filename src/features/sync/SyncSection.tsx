import { useObservable } from 'dexie-react-hooks'
import { LogIn, LogOut, RefreshCw, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { useToast } from '../../components/toast-context'
import { cloudEnabled, db } from '../../db/db'
import { describeSyncStatus } from './texts'
import { SyncStatusIcon } from './SyncStatusIcon'

const isCancelled = (error: unknown) => error instanceof Error && error.name === 'AbortError'

function formatTime(date: Date | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Bagian Pengaturan untuk masuk/keluar sinkronisasi antar-perangkat. Tidak tampil bila sinkronisasi tidak dikonfigurasi. */
export function SyncSection() {
  return cloudEnabled ? <SyncSectionContent /> : null
}

function SyncSectionContent() {
  const user = useObservable(db.cloud.currentUser)
  const syncState = useObservable(db.cloud.syncState)
  const persisted = useObservable(db.cloud.persistedSyncState)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()
  const status = describeSyncStatus(syncState, user)
  const lastSync = formatTime(persisted?.timestamp)
  const license = user?.license

  const login = async () => {
    setBusy(true)
    try {
      await db.cloud.login()
      toast({ message: 'Berhasil masuk. Data sedang disinkronkan.' })
    } catch (error) {
      if (!isCancelled(error))
        toast({ message: `Gagal masuk: ${error instanceof Error ? error.message : 'galat tidak diketahui'}`, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const syncNow = async () => {
    setBusy(true)
    try {
      await db.cloud.sync({ purpose: 'pull', wait: true })
      toast({ message: 'Sinkronisasi selesai.' })
    } catch (error) {
      toast({ message: `Gagal sinkron: ${error instanceof Error ? error.message : 'galat tidak diketahui'}`, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    const ok = await confirm({
      title: 'Keluar dari sinkronisasi?',
      message:
        'Data akan dihapus dari perangkat ini saja. Data tetap aman di cloud dan muncul lagi saat kamu masuk kembali dengan email yang sama.',
      confirmLabel: 'Keluar',
      danger: true,
    })
    if (!ok) return
    try {
      await db.cloud.logout()
      toast({ message: 'Kamu sudah keluar. Data di perangkat ini dikosongkan.', tone: 'info' })
    } catch (error) {
      if (!isCancelled(error)) toast({ message: 'Gagal keluar. Coba lagi.', tone: 'error' })
    }
  }

  return (
    <section aria-labelledby="sync-title" className="card space-y-3 p-4">
      <h2 id="sync-title" className="flex items-center gap-2 font-semibold">
        <Smartphone size={18} aria-hidden="true" /> Sinkronisasi HP & laptop
      </h2>

      {user?.isLoggedIn ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Masuk sebagai <span className="font-semibold break-all">{user.email ?? user.userId}</span>
          </p>
          <p className="flex items-center gap-2 text-sm" role="status">
            <SyncStatusIcon tone={status.tone} />
            <span>{status.label}</span>
          </p>
          {lastSync && <p className="text-xs text-slate-500 dark:text-slate-400">Terakhir sinkron: {lastSync}</p>}
          {license?.type === 'eval' && license.status === 'ok' && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Akun uji coba{license.evalDaysLeft != null ? ` — ${license.evalDaysLeft} hari aktif lagi` : ''}. Pemilik aplikasi perlu
              menjadikan akun ini permanen di Dexie Cloud Manager agar sinkronisasi tidak berhenti.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" disabled={busy} onClick={syncNow}>
              <RefreshCw size={16} aria-hidden="true" /> Sinkronkan
            </button>
            <button type="button" className="btn-ghost-danger border border-rose-200 dark:border-rose-900" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> Keluar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Masuk dengan email yang sama di HP dan laptop agar data tersambung otomatis. Data yang sudah ada di perangkat ini akan ikut
            diunggah. Tanpa masuk, data tetap hanya tersimpan di perangkat ini.
          </p>
          <button type="button" className="btn-primary w-full" disabled={busy} onClick={login}>
            <LogIn size={16} aria-hidden="true" /> Masuk / Daftar dengan email
          </button>
        </>
      )}
    </section>
  )
}
