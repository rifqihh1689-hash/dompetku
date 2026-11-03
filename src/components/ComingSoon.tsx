import { Hourglass } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} />
      <div className="card">
        <EmptyState icon={Hourglass} title="Segera hadir" />
      </div>
    </div>
  )
}
