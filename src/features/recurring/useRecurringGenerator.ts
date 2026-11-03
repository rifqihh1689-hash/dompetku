import { useEffect } from 'react'
import { useToast } from '../../components/toast-context'
import { generateRecurringTransactions } from './repository'

/**
 * Membuat transaksi berulang yang jatuh tempo saat aplikasi dibuka,
 * dan setiap kali aplikasi kembali ditampilkan (mis. dibuka lagi keesokan harinya).
 */
export function useRecurringGenerator(): void {
  const toast = useToast()
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const added = await generateRecurringTransactions()
        if (!cancelled && added > 0) {
          toast({ message: `${added} transaksi berulang ditambahkan otomatis.`, tone: 'info' })
        }
      } catch (error) {
        console.error('Gagal membuat transaksi berulang', error)
      }
    }
    void run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [toast])
}
