import type { Category } from '../../types'

/**
 * ID kategori bawaan diawali "#": di server sinkronisasi (Dexie Cloud) ID seperti ini
 * otomatis dibuat unik per pengguna, sehingga setiap orang punya "Makan"-nya sendiri.
 */
export const FALLBACK_CATEGORY_ID = '#cat-lainnya'

/**
 * Kategori bawaan. Tidak disimpan di database kecuali diubah/dihapus pengguna
 * (lihat `mergeCategories`), agar perangkat baru tidak menimpa perubahan dari perangkat lain.
 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: '#cat-makan', name: 'Makan', icon: 'utensils', color: '#eb6834', kind: 'expense', builtIn: true, createdAt: 0 },
  { id: '#cat-transportasi', name: 'Transportasi', icon: 'car', color: '#2a78d6', kind: 'expense', builtIn: true, createdAt: 1 },
  { id: '#cat-belanja', name: 'Belanja', icon: 'shopping-bag', color: '#e87ba4', kind: 'expense', builtIn: true, createdAt: 2 },
  { id: '#cat-tagihan', name: 'Tagihan', icon: 'receipt', color: '#e34948', kind: 'expense', builtIn: true, createdAt: 3 },
  { id: '#cat-hiburan', name: 'Hiburan', icon: 'clapperboard', color: '#6250d6', kind: 'expense', builtIn: true, createdAt: 4 },
  { id: '#cat-kesehatan', name: 'Kesehatan', icon: 'heart-pulse', color: '#1baf7a', kind: 'expense', builtIn: true, createdAt: 5 },
  { id: '#cat-gaji', name: 'Gaji', icon: 'wallet', color: '#008300', kind: 'income', builtIn: true, createdAt: 6 },
  { id: FALLBACK_CATEGORY_ID, name: 'Lainnya', icon: 'ellipsis', color: '#64748b', kind: 'both', builtIn: true, createdAt: 7 },
]

const DEFAULT_BY_ID = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]))

export function getDefaultCategory(id: string): Category | undefined {
  return DEFAULT_BY_ID.get(id)
}

export function isBuiltInCategoryId(id: string): boolean {
  return DEFAULT_BY_ID.has(id)
}

/** ID kategori bawaan versi lama (v1.0, tanpa "#") → ID baru. ID lain dikembalikan apa adanya. */
export function migrateLegacyCategoryId(id: string): string {
  return DEFAULT_BY_ID.has(`#${id}`) ? `#${id}` : id
}

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
