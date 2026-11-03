import { db } from '../db/db'

/** Menghapus & membuka ulang database agar setiap tes mulai dari keadaan awal (dengan kategori bawaan). */
export async function resetDatabase(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}
