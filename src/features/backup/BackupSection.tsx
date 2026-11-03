import { Download, FileBraces, FileSpreadsheet, Trash, Upload } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { Modal } from '../../components/Modal'
import { MonthSelect } from '../../components/MonthSelect'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { downloadTextFile } from '../../lib/download'
import { formatMonthLabel } from '../../lib/date'
import { UNKNOWN_CATEGORY } from '../categories/defaults'
import { backupFileName, CSV_BOM, csvFileName, parseBackup, serializeBackup, transactionsToCsv, type BackupFile, type CsvDelimiter } from './backup'
import { clearAllData, exportBackup, importBackup, type ImportMode } from './repository'

function formatExportedAt(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
}

export function BackupSection() {
  const toast = useToast()
  const confirm = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [busy, setBusy] = useState(false)
  const [csvMonth, setCsvMonth] = useState('')
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(';')
  const ids = { csvMonth: useId(), delimiter: useId() }

  const handleExportJson = async () => {
    const backup = await exportBackup()
    downloadTextFile(backupFileName(), serializeBackup(backup), 'application/json')
    toast({ message: `Backup berisi ${backup.data.transactions.length} transaksi diunduh.` })
  }

  const handleExportCsv = async () => {
    const month = csvMonth || null
    const [transactions, categories] = await Promise.all([
      month ? db.transactions.where('date').between(`${month}-01`, `${month}-31`, true, true).toArray() : db.transactions.toArray(),
      db.categories.toArray(),
    ])
    if (transactions.length === 0) {
      toast({ message: 'Tidak ada transaksi untuk diekspor.', tone: 'warning' })
      return
    }
    const names = new Map(categories.map((c) => [c.id, c.name]))
    const csv = transactionsToCsv(transactions, (id) => names.get(id) ?? UNKNOWN_CATEGORY.name, delimiter)
    downloadTextFile(csvFileName(month), CSV_BOM + csv, 'text/csv;charset=utf-8')
    toast({ message: `${transactions.length} transaksi diekspor ke CSV.` })
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      toast({ message: result.error, tone: 'error', duration: 6000 })
      return
    }
    setPending(result.backup)
  }

  const runImport = async (mode: ImportMode) => {
    if (!pending) return
    if (mode === 'replace') {
      const ok = await confirm({
        title: 'Ganti semua data?',
        message: 'Semua data di perangkat ini akan dihapus dan diganti dengan isi backup. Tindakan ini tidak dapat dibatalkan.',
        confirmLabel: 'Ganti semua',
        danger: true,
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      await importBackup(pending, mode)
      toast({ message: `Data berhasil dipulihkan (${pending.data.transactions.length} transaksi).` })
      setPending(null)
    } catch (e) {
      toast({ message: `Gagal memulihkan data: ${e instanceof Error ? e.message : 'galat tidak diketahui'}`, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Hapus semua data?',
      message: 'Semua transaksi, anggaran, transaksi berulang, dan kategori kustom akan dihapus permanen. Sebaiknya buat backup terlebih dahulu.',
      confirmLabel: 'Hapus semua',
      danger: true,
    })
    if (!ok) return
    await clearAllData()
    toast({ message: 'Semua data telah dihapus.', tone: 'info' })
  }

  return (
    <>
      <section aria-labelledby="backup-title" className="card space-y-4 p-4">
        <div>
          <h2 id="backup-title" className="font-semibold">
            Backup & Restore
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Data hanya tersimpan di perangkat ini. Buat backup secara berkala agar data aman saat ganti HP atau membersihkan browser.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" onClick={handleExportJson}>
            <Download size={16} aria-hidden="true" /> Export JSON
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Import JSON
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} data-testid="import-input" />
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileSpreadsheet size={16} aria-hidden="true" /> Export CSV (Excel)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={ids.csvMonth} className="label text-xs">
                Periode
              </label>
              <MonthSelect id={ids.csvMonth} value={csvMonth} onChange={setCsvMonth} emptyLabel="Semua transaksi" />
            </div>
            <div>
              <label htmlFor={ids.delimiter} className="label text-xs">
                Pemisah kolom
              </label>
              <select id={ids.delimiter} value={delimiter} onChange={(e) => setDelimiter(e.target.value as CsvDelimiter)} className="field">
                <option value=";">Titik koma ( ; )</option>
                <option value=",">Koma ( , )</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gunakan titik koma untuk Excel berbahasa Indonesia, koma untuk Excel berbahasa Inggris atau Google Sheets.
          </p>
          <button type="button" className="btn-secondary w-full" onClick={handleExportCsv}>
            <Download size={16} aria-hidden="true" /> Unduh CSV{csvMonth ? ` ${formatMonthLabel(csvMonth)}` : ''}
          </button>
        </div>
      </section>

      <section aria-labelledby="danger-title" className="card space-y-3 border-rose-200 p-4 dark:border-rose-900/60">
        <h2 id="danger-title" className="font-semibold text-rose-700 dark:text-rose-400">
          Zona berbahaya
        </h2>
        <button type="button" className="btn-ghost-danger w-full border border-rose-200 dark:border-rose-900" onClick={handleClear}>
          <Trash size={16} aria-hidden="true" /> Hapus semua data
        </button>
      </section>

      <Modal open={pending !== null} title="Pulihkan backup" onClose={() => setPending(null)}>
        {pending && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
              <FileBraces size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-slate-500 dark:text-slate-400">Dibuat</dt>
                <dd>{formatExportedAt(pending.exportedAt)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Transaksi</dt>
                <dd>{pending.data.transactions.length}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Kategori</dt>
                <dd>{pending.data.categories.length}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Anggaran</dt>
                <dd>{pending.data.budgets.length}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Berulang</dt>
                <dd>{pending.data.recurring.length}</dd>
              </dl>
            </div>
            <div className="space-y-2">
              <button type="button" disabled={busy} className="btn-primary w-full py-3" onClick={() => void runImport('merge')}>
                Gabungkan dengan data sekarang
              </button>
              <button type="button" disabled={busy} className="btn-danger w-full py-3" onClick={() => void runImport('replace')}>
                Ganti semua data
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                “Gabungkan” menambahkan isi backup; data dengan ID yang sama akan diperbarui. “Ganti semua” menghapus data saat ini terlebih dahulu.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
