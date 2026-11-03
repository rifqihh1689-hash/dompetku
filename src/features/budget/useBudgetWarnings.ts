import { useCallback } from 'react'
import { useToast } from '../../components/toast-context'
import { db } from '../../db/db'
import { monthOf } from '../../lib/date'
import type { TransactionInput } from '../../types'
import { checkBudget } from './repository'

/** Mengembalikan callback yang menampilkan peringatan bila pengeluaran membuat anggaran ≥ 80% / melebihi. */
export function useBudgetWarnings(): (input: TransactionInput) => void {
  const toast = useToast()
  return useCallback(
    (input: TransactionInput) => {
      if (input.type !== 'expense') return
      void (async () => {
        const category = await db.categories.get(input.categoryId)
        if (!category) return
        const result = await checkBudget(monthOf(input.date), category)
        if (result) toast({ message: result.message, tone: result.level === 'over' ? 'error' : 'warning', duration: 6000 })
      })()
    },
    [toast],
  )
}
