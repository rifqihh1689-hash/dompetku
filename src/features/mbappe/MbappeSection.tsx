import { ArrowDownToLine, ArrowUpFromLine, Copy, Download, Upload } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { downloadTextFile } from '../../lib/download'
import { todayISO } from '../../lib/date'
import { parseBackup } from '../backup/backup'
import { getCategories } from '../categories/repository'
import { isMbappeFile } from './import'
import { buildSummary, summaryFileName } from './summary'
import { useMbappeImport } from './useMbappeImport'

async function createSummaryText(): Promise<string> {
  const [transactions, categories] = await Promise.all([db.transactions.toArray(), getCategories()])
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const summary = buildSummary(transactions, (id) => names.get(id) ?? 'Tanpa kategori', todayISO())
  return JSON.stringify(summary, null, 2)
}

/** Jembatan data dua arah dengan Markas Mbappe (aplikasi Dana Jembatan di claude.ai) lewat file. */
export function MbappeSection() {
  const toast = useToast()
  const importMbappe = useMbappeImport()
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      toast({ message: result.error, tone: 'error', duration: 6000 })
      return
    }
    if (!isMbappeFile(result.backup)) {
      toast({ message: 'Ini bukan file dari Markas Mbappe. Untuk backup Dompetku, gunakan Import JSON di bagian Backup.', tone: 'error' })
      return
    }
    await importMbappe(result.backup)
  }

  const handleDownload = async () => {
    downloadTextFile(summaryFileName(todayISO()), await createSummaryText(), 'application/json')
    toast({ message: 'Ringkasan diunduh. Impor file ini di Markas Mbappe.' })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(await createSummaryText())
      toast({ message: 'Ringkasan disalin. Tempel di Markas Mbappe → Sambungan Dompetku.' })
    } catch {
      toast({ message: 'Tidak bisa menyalin di browser ini. Gunakan tombol Unduh.', tone: 'error' })
    }
  }

  return (
    <section aria-labelledby="mbappe-title" className="card space-y-4 p-4">
      <div>
        <h2 id="mbappe-title" className="font-semibold">
          Sambungan Markas Mbappe
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tukar data dengan Markas Mbappe (Dana Jembatan) lewat file, dua arah. Di Markas Mbappe, buka tab Dana → bagian Sambungan Dompetku.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ArrowDownToLine size={16} aria-hidden="true" /> Markas Mbappe → Dompetku
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pemasukan yang sudah diterima di Markas Mbappe dicatat sebagai Pemasukan di sini, dengan kategori per sumber. Aman diulang: tidak
          akan dobel.
        </p>
        <button type="button" className="btn-primary w-full" onClick={() => fileInput.current?.click()}>
          <Upload size={16} aria-hidden="true" /> Terima pemasukan dari Markas Mbappe
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFile}
          data-testid="mbappe-input"
        />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ArrowUpFromLine size={16} aria-hidden="true" /> Dompetku → Markas Mbappe
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ringkasan saldo, pemasukan & pengeluaran per bulan, dan rata-rata pengeluaran — tanpa rincian transaksi. Markas Mbappe memakainya
          untuk menghitung Dana Jembatan cukup untuk berapa bulan.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={handleDownload}>
            <Download size={16} aria-hidden="true" /> Unduh ringkasan
          </button>
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            <Copy size={16} aria-hidden="true" /> Salin ringkasan
          </button>
        </div>
      </div>
    </section>
  )
}
