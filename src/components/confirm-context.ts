import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false)

/** Menampilkan dialog konfirmasi; resolve `true` jika pengguna menyetujui. */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return useContext(ConfirmContext)
}
