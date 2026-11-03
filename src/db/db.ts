import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_CATEGORIES } from '../features/categories/defaults'
import type { Budget, Category, RecurringRule, Transaction } from '../types'

export type DompetkuDB = Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: EntityTable<Budget, 'id'>
  recurring: EntityTable<RecurringRule, 'id'>
}

export const DB_NAME = 'dompetku'

export function createDatabase(name: string = DB_NAME): DompetkuDB {
  const db = new Dexie(name) as DompetkuDB

  db.version(1).stores({
    transactions: 'id, date, type, categoryId, recurringId',
    categories: 'id, name',
    budgets: 'id, month, categoryId',
    recurring: 'id, active',
  })

  // Diisi sekali saat database pertama kali dibuat.
  db.on('populate', (tx) => {
    void tx.table('categories').bulkAdd(DEFAULT_CATEGORIES.map((c) => ({ ...c })))
  })

  return db
}

/** Instans database utama aplikasi (IndexedDB di perangkat). */
export const db = createDatabase()
