import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { useCategories } from '../../db/hooks'
import type { Transaction, TransactionInput } from '../../types'
import { TransactionEditorContext, type TransactionEditor } from './editor-context'
import { addTransaction, deleteTransaction, updateTransaction } from './repository'
import { TransactionForm } from './TransactionForm'

type EditorState = { mode: 'new'; defaults?: Partial<TransactionInput>; key: number } | { mode: 'edit'; transaction: Transaction; key: number }

interface TransactionEditorProviderProps {
  children: ReactNode
  /** Dipanggil setelah transaksi tersimpan (mis. untuk memeriksa anggaran). */
  onSaved?: (input: TransactionInput) => void
}

export function TransactionEditorProvider({ children, onSaved }: TransactionEditorProviderProps) {
  const [state, setState] = useState<EditorState | null>(null)
  const categories = useCategories() ?? []
  const toast = useToast()
  const confirm = useConfirm()

  const editor = useMemo<TransactionEditor>(
    () => ({
      openNew: (defaults) => setState({ mode: 'new', defaults, key: Date.now() }),
      openEdit: (transaction) => setState({ mode: 'edit', transaction, key: Date.now() }),
    }),
    [],
  )

  const close = useCallback(() => setState(null), [])

  const handleSubmit = async (input: TransactionInput) => {
    if (state?.mode === 'edit') {
      await updateTransaction(state.transaction.id, input)
      toast({ message: 'Transaksi diperbarui.' })
    } else {
      await addTransaction(input)
      toast({ message: input.type === 'income' ? 'Pemasukan dicatat.' : 'Pengeluaran dicatat.' })
    }
    close()
    onSaved?.(input)
  }

  const handleDelete = async () => {
    if (state?.mode !== 'edit') return
    const target = state.transaction
    const ok = await confirm({
      title: 'Hapus transaksi?',
      message: 'Transaksi ini akan dihapus dari riwayat.',
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    await deleteTransaction(target.id)
    close()
    toast({
      message: 'Transaksi dihapus.',
      tone: 'info',
      duration: 6000,
      action: { label: 'Urungkan', onClick: () => void db.transactions.put(target) },
    })
  }

  return (
    <TransactionEditorContext.Provider value={editor}>
      {children}
      <Modal open={state !== null} title={state?.mode === 'edit' ? 'Ubah Transaksi' : 'Tambah Transaksi'} onClose={close}>
        {state && (
          <TransactionForm
            key={state.key}
            categories={categories}
            initial={state.mode === 'edit' ? state.transaction : undefined}
            defaults={state.mode === 'new' ? state.defaults : undefined}
            onSubmit={handleSubmit}
            onDelete={state.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>
    </TransactionEditorContext.Provider>
  )
}
