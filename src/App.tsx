import { useRoute, type Route } from './app/router'
import { BottomNav } from './components/BottomNav'
import { ComingSoon } from './components/ComingSoon'
import { ConfirmProvider } from './components/ConfirmProvider'
import { Fab } from './components/Fab'
import { ToastProvider } from './components/Toast'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useTransactionEditor } from './features/transactions/editor-context'
import { HistoryPage } from './features/transactions/HistoryPage'
import { TransactionEditorProvider } from './features/transactions/TransactionEditorProvider'

function Page({ route }: { route: Route }) {
  switch (route) {
    case 'beranda':
      return <DashboardPage />
    case 'riwayat':
      return <HistoryPage />
    case 'anggaran':
      return <ComingSoon title="Anggaran" />
    case 'berulang':
      return <ComingSoon title="Transaksi Berulang" />
    case 'pengaturan':
      return <SettingsPage />
  }
}

function Shell() {
  const route = useRoute()
  const { openNew } = useTransactionEditor()
  return (
    <>
      <main className="mx-auto min-h-dvh max-w-lg px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Page route={route} />
      </main>
      {route !== 'pengaturan' && <Fab onClick={() => openNew()} />}
      <BottomNav active={route} />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <TransactionEditorProvider>
          <Shell />
        </TransactionEditorProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
