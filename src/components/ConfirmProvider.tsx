import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ConfirmContext, type ConfirmOptions } from './confirm-context'
import { Modal } from './Modal'

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={options !== null} title={options?.title ?? ''} onClose={() => close(false)} variant="dialog">
        <p className="text-sm text-slate-600 dark:text-slate-300">{options?.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => close(false)}>
            {options?.cancelLabel ?? 'Batal'}
          </button>
          <button type="button" className={options?.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)}>
            {options?.confirmLabel ?? 'Ya, lanjutkan'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}
