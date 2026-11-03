import type { Category } from '../../types'

/** ID kategori cadangan: transaksi dari kategori yang dihapus dipindahkan ke sini. */
export const FALLBACK_CATEGORY_ID = 'cat-lainnya'

/** Kategori bawaan. ID tetap agar konsisten antar perangkat & backup. */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'cat-makan', name: 'Makan', icon: 'utensils', color: '#eb6834', kind: 'expense', builtIn: true, createdAt: 0 },
  { id: 'cat-transportasi', name: 'Transportasi', icon: 'car', color: '#2a78d6', kind: 'expense', builtIn: true, createdAt: 1 },
  { id: 'cat-belanja', name: 'Belanja', icon: 'shopping-bag', color: '#e87ba4', kind: 'expense', builtIn: true, createdAt: 2 },
  { id: 'cat-tagihan', name: 'Tagihan', icon: 'receipt', color: '#e34948', kind: 'expense', builtIn: true, createdAt: 3 },
  { id: 'cat-hiburan', name: 'Hiburan', icon: 'clapperboard', color: '#6250d6', kind: 'expense', builtIn: true, createdAt: 4 },
  { id: 'cat-kesehatan', name: 'Kesehatan', icon: 'heart-pulse', color: '#1baf7a', kind: 'expense', builtIn: true, createdAt: 5 },
  { id: 'cat-gaji', name: 'Gaji', icon: 'wallet', color: '#008300', kind: 'income', builtIn: true, createdAt: 6 },
  { id: FALLBACK_CATEGORY_ID, name: 'Lainnya', icon: 'ellipsis', color: '#64748b', kind: 'both', builtIn: true, createdAt: 7 },
]

/** Kategori yang ditampilkan bila ID kategori tidak ditemukan. */
export const UNKNOWN_CATEGORY: Category = {
  id: '__unknown__',
  name: 'Tanpa kategori',
  icon: 'tag',
  color: '#94a3b8',
  kind: 'both',
  builtIn: true,
  createdAt: 0,
}
