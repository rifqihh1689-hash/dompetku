import { useCallback } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { useToast } from '../../components/toast-context'
import type { BackupFile } from '../backup/backup'
import { importFromMbappe } from './import'

/** Konfirmasi lalu terapkan kiriman Markas Mbappe; menampilkan hasilnya sebagai toast. */
export function useMbappeImport(): (backup: BackupFile) => Promise<void> {
  const confirm = useConfirm()
  const toast = useToast()
  return useCallback(
    async (backup: BackupFile) => {
      const count = backup.data.transactions.length
      const ok = await confirm({
        title: 'Terima pemasukan dari Markas Mbappe?',
        message:
          `${count} pemasukan dari kas Markas Mbappe akan dicatat di Dompetku. ` +
          'Yang sudah pernah diterima diperbarui (tidak dobel), dan pemasukan yang sudah dihapus di Markas Mbappe ikut dihapus di sini. ' +
          'Transaksi Dompetku lainnya tidak berubah.',
        confirmLabel: 'Terima',
      })
      if (!ok) return
      try {
        const { added, updated, removed } = await importFromMbappe(backup)
        const parts = [`${added} baru`, `${updated} diperbarui`]
        if (removed > 0) parts.push(`${removed} dihapus`)
        toast({ message: `Pemasukan Markas Mbappe diterima: ${parts.join(', ')}.` })
      } catch (e) {
        toast({ message: `Gagal menerima data: ${e instanceof Error ? e.message : 'galat tidak diketahui'}`, tone: 'error' })
      }
    },
    [confirm, toast],
  )
}
