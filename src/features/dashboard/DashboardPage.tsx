import { PageHeader } from '../../components/PageHeader'
import { useCategoryLookup, useTransactions } from '../../db/hooks'
import { currentMonth } from '../../lib/date'
import { TransactionList } from '../transactions/TransactionList'

export function DashboardPage() {
  const transactions = useTransactions(currentMonth())
  const getCategory = useCategoryLookup()
  return (
    <div className="space-y-4">
      <PageHeader title="Dompetku" />
      <TransactionList transactions={(transactions ?? []).slice(0, 10)} getCategory={getCategory} />
    </div>
  )
}
