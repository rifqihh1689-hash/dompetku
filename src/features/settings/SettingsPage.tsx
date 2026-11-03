import { PageHeader } from '../../components/PageHeader'
import { cloudEnabled } from '../../db/db'
import { BackupSection } from '../backup/BackupSection'
import { CategoryManager } from '../categories/CategoryManager'
import { InstallSection } from '../pwa/InstallSection'
import { SyncSection } from '../sync/SyncSection'
import { ThemeSection } from './ThemeSection'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan" />
      <SyncSection />
      <ThemeSection />
      <InstallSection />
      <CategoryManager />
      <BackupSection />
      <p className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Dompetku v{__APP_VERSION__} · Data tersimpan di perangkat ini
        {cloudEnabled ? ' dan, bila masuk, tersinkron lewat Dexie Cloud' : ', tanpa server'}.
      </p>
    </div>
  )
}
