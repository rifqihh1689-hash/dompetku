import { PageHeader } from '../../components/PageHeader'
import { BackupSection } from '../backup/BackupSection'
import { CategoryManager } from '../categories/CategoryManager'
import { ThemeSection } from './ThemeSection'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan" />
      <ThemeSection />
      <CategoryManager />
      <BackupSection />
      <p className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Dompetku v{__APP_VERSION__} · Semua data tersimpan di perangkat ini, tanpa server.
      </p>
    </div>
  )
}
