import { Plus } from 'lucide-react'

/** Tombol tambah transaksi mengambang — di kanan bawah agar mudah dijangkau ibu jari. */
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto flex max-w-lg justify-end px-4">
        <button
          type="button"
          onClick={onClick}
          aria-label="Tambah transaksi"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-95"
        >
          <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
