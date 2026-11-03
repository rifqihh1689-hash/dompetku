import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '../../db/db'
import { useCategoryLookup, useTransactions } from '../../db/hooks'
import type { MonthKey } from '../../types'
import { computeBudgetUsage, type BudgetUsage } from './budget'

/** Pemakaian anggaran untuk bulan tertentu. `undefined` selama memuat. */
export function useBudgetUsage(month: MonthKey): BudgetUsage[] | undefined {
  const budgets = useLiveQuery(() => db.budgets.where('month').equals(month).toArray(), [month])
  const transactions = useTransactions(month)
  const getCategory = useCategoryLookup()
  return useMemo(
    () => (budgets && transactions ? computeBudgetUsage(budgets, transactions, getCategory) : undefined),
    [budgets, transactions, getCategory],
  )
}
