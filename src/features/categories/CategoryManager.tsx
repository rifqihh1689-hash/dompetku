import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm-context'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/toast-context'
import { useCategories } from '../../db/hooks'
import type { Category } from '../../types'
import { CategoryForm } from './CategoryForm'
import { CategoryIcon } from './CategoryIcon'
import { FALLBACK_CATEGORY_ID } from './defaults'
import { addCategory, countCategoryUsage, deleteCategory, updateCategory, type CategoryInput } from './repository'

const KIND_LABEL = { expense: 'Pengeluaran', income: 'Pemasukan', both: 'Pemasukan & pengeluaran' } as const

export function CategoryManager() {
  const categories = useCategories()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const toast = useToast()
  const confirm = useConfirm()

  const handleSubmit = async (input: CategoryInput) => {
    if (editing === 'new') {
      await addCategory(input)
      toast({ message: `Kategori "${input.name.trim()}" ditambahkan.` })
    } else if (editing) {
      await updateCategory(editing.id, input)
      toast({ message: 'Kategori diperbarui.' })
    }
    setEditing(null)
  }

  const handleDelete = async (category: Category) => {
    const used = await countCategoryUsage(category.id)
    const ok = await confirm({
      title: `Hapus kategori "${category.name}"?`,
      message:
        used > 0
          ? `${used} transaksi di kategori ini akan dipindahkan ke "Lainnya". Anggaran kategori ini juga dihapus.`
          : 'Kategori ini belum dipakai transaksi apa pun.',
      confirmLabel: 'Hapus',
      danger: true,
    })
    if (!ok) return
    await deleteCategory(category.id)
    setEditing(null)
    toast({ message: 'Kategori dihapus.', tone: 'info' })
  }

  return (
    <section aria-labelledby="kategori-title" className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 id="kategori-title" className="font-semibold">
          Kategori
        </h2>
        <button type="button" onClick={() => setEditing('new')} className="btn-secondary px-3 py-1.5">
          <Plus size={16} aria-hidden="true" /> Tambah
        </button>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {(categories ?? []).map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => setEditing(category)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <CategoryIcon icon={category.icon} color={category.color} size="sm" />
              <span className="flex-1">
                <span className="block font-medium">{category.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {KIND_LABEL[category.kind]}
                  {category.builtIn && ' · Bawaan'}
                </span>
              </span>
              <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <Modal open={editing !== null} title={editing === 'new' ? 'Kategori Baru' : 'Ubah Kategori'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <CategoryForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            onSubmit={handleSubmit}
            onDelete={editing !== 'new' && editing.id !== FALLBACK_CATEGORY_ID ? () => void handleDelete(editing) : undefined}
          />
        )}
      </Modal>
    </section>
  )
}
