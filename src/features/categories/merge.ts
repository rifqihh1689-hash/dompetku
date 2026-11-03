import type { Category } from '../../types'
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID, getDefaultCategory, isBuiltInCategoryId, migrateLegacyCategoryId } from './defaults'

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name))
}

/** Salinan kategori tanpa properti internal (`deleted`, serta `owner`/`realmId` dari sinkronisasi). */
function clean(category: Category): Category {
  const { id, name, icon, color, kind, builtIn, createdAt } = category
  return { id, name, icon, color, kind, builtIn, createdAt }
}

/**
 * Menggabungkan kategori bawaan dengan baris di database.
 * Database hanya menyimpan kategori buatan pengguna dan *perubahan* atas kategori bawaan:
 * - baris dengan ID bawaan menimpa nama/ikon/warna/jenisnya,
 * - baris dengan `deleted: true` menyembunyikan kategori bawaan ("Lainnya" tidak bisa disembunyikan).
 */
export function mergeCategories(rows: readonly Category[]): Category[] {
  const overrides = new Map(rows.filter((r) => isBuiltInCategoryId(r.id)).map((r) => [r.id, r]))
  const result: Category[] = []
  for (const def of DEFAULT_CATEGORIES) {
    const override = overrides.get(def.id)
    if (override?.deleted && def.id !== FALLBACK_CATEGORY_ID) continue
    result.push(override ? clean({ ...def, ...override, id: def.id, builtIn: true }) : def)
  }
  for (const row of rows) {
    if (!isBuiltInCategoryId(row.id) && !row.deleted) result.push(clean({ ...row, builtIn: false }))
  }
  return sortCategories(result)
}

function sameAsDefault(row: Category, def: Category): boolean {
  return row.name === def.name && row.icon === def.icon && row.color === def.color && row.kind === def.kind
}

/**
 * Mengubah daftar kategori format lama (v1.0: semua kategori bawaan disimpan dengan ID "cat-…")
 * menjadi baris format baru: ID baru, kategori bawaan yang tidak diubah dibuang, dan kategori
 * bawaan yang dulu dihapus dicatat sebagai `deleted`.
 *
 * Penanda "dihapus" hanya dibuat bila daftar lengkap (memuat "Lainnya"), agar daftar parsial
 * tidak dianggap menghapus semua kategori bawaan.
 */
export function normalizeCategoryRows(rows: readonly Category[]): Category[] {
  const migrated = rows.map((row) => ({ ...row, id: migrateLegacyCategoryId(row.id) }))
  const isLegacyFullList = rows.some((r) => r.id === 'cat-lainnya')
  const present = new Set(migrated.map((r) => r.id))
  const result: Category[] = []
  for (const row of migrated) {
    const def = getDefaultCategory(row.id)
    if (def && !row.deleted && sameAsDefault(row, def)) continue
    result.push(def ? { ...row, builtIn: true } : { ...row, builtIn: false })
  }
  if (isLegacyFullList) {
    for (const def of DEFAULT_CATEGORIES) {
      if (!present.has(def.id) && def.id !== FALLBACK_CATEGORY_ID) result.push({ ...def, deleted: true })
    }
  }
  return result
}
