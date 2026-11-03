import { createContext, useContext } from 'react'
import type { Transaction, TransactionInput } from '../../types'

export interface TransactionEditor {
  /** Membuka form transaksi baru (opsional dengan nilai awal). */
  openNew: (defaults?: Partial<TransactionInput>) => void
  /** Membuka form untuk mengubah transaksi. */
  openEdit: (transaction: Transaction) => void
}

export const TransactionEditorContext = createContext<TransactionEditor>({ openNew: () => {}, openEdit: () => {} })

export function useTransactionEditor(): TransactionEditor {
  return useContext(TransactionEditorContext)
}
