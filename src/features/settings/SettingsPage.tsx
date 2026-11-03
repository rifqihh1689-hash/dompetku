import { PageHeader } from '../../components/PageHeader'
import { BackupSection } from '../backup/BackupSection'
import { CategoryManager } from '../categories/CategoryManager'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan" />
      <CategoryManager />
      <BackupSection />
    </div>
  )
}
