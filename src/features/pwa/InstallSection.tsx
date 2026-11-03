import { CircleCheck, Share, Smartphone, SquarePlus } from 'lucide-react'
import { useToast } from '../../components/toast-context'
import { isIOS, useInstallPrompt } from './install'

/** Bagian Pengaturan untuk memasang Dompetku ke layar utama HP. */
export function InstallSection() {
  const { canInstall, installed, install } = useInstallPrompt()
  const toast = useToast()

  return (
    <section aria-labelledby="install-title" className="card space-y-3 p-4">
      <h2 id="install-title" className="flex items-center gap-2 font-semibold">
        <Smartphone size={18} aria-hidden="true" /> Pasang di HP
      </h2>
      {installed ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CircleCheck size={16} aria-hidden="true" /> Dompetku sudah terpasang sebagai aplikasi.
        </p>
      ) : canInstall ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pasang Dompetku agar bisa dibuka dari layar utama dan dipakai tanpa internet.
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              if (await install()) toast({ message: 'Dompetku berhasil dipasang.' })
            }}
          >
            <SquarePlus size={16} aria-hidden="true" /> Pasang aplikasi
          </button>
        </>
      ) : isIOS() ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Di Safari, ketuk tombol <Share size={14} className="inline align-text-bottom" aria-label="Bagikan" /> lalu pilih{' '}
          <strong>“Tambah ke Layar Utama”</strong>.
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Buka menu browser (⋮) lalu pilih <strong>“Instal aplikasi”</strong> atau <strong>“Tambahkan ke layar utama”</strong>.
        </p>
      )}
    </section>
  )
}
