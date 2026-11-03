import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Tumpukan modal yang terbuka — hanya modal teratas yang merespons tombol Escape. */
const openStack: symbol[] = []

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** `sheet`: muncul dari bawah (mobile). `dialog`: kotak kecil di tengah. */
  variant?: 'sheet' | 'dialog'
}

export function Modal({ open, title, onClose, children, variant = 'sheet' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const token = Symbol('modal')
    openStack.push(token)
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openStack[openStack.length - 1] === token) {
        event.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      openStack.splice(openStack.indexOf(token), 1)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  const isSheet = variant === 'sheet'
  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center ${isSheet ? 'items-end sm:items-center' : 'items-center p-6'}`}>
      <div className="animate-fade-in absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role={isSheet ? 'dialog' : 'alertdialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={
          isSheet
            ? 'animate-slide-up relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none sm:rounded-3xl sm:pt-5 dark:bg-slate-900'
            : 'animate-fade-in relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl outline-none dark:bg-slate-900'
        }
      >
        {isSheet && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700" aria-hidden="true" />}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {isSheet && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-2 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
