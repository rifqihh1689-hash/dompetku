import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Tumpukan modal yang terbuka — hanya modal teratas yang merespons tombol Escape. */
const openStack: symbol[] = []

/**
 * Elemen terakhir yang difokus di luar modal (mis. tombol pembuka), untuk dikembalikan fokusnya
 * saat modal ditutup. Dilacak global karena isi modal bisa langsung mengambil fokus (autoFocus).
 */
let lastFocusOutside: HTMLElement | null = null
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (event) => {
    const target = event.target
    if (target instanceof HTMLElement && !target.closest('[aria-modal="true"]')) lastFocusOutside = target
  })
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Menjaga fokus keyboard (Tab / Shift+Tab) tetap di dalam modal. */
function trapFocus(event: KeyboardEvent, panel: HTMLElement) {
  const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

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
    const active = document.activeElement
    const previousFocus = active instanceof HTMLElement && !panelRef.current?.contains(active) ? active : lastFocusOutside
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Jangan ambil alih fokus bila isi modal sudah memfokuskan input (autoFocus).
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
      } else if (event.key === 'Tab' && panelRef.current) {
        trapFocus(event, panelRef.current)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      openStack.splice(openStack.indexOf(token), 1)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
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
