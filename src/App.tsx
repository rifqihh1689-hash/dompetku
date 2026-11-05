import { useState, type ReactNode } from 'react'
import { useRoute, type Route } from './app/router'
import { BottomNav } from './components/BottomNav'
import { ConfirmProvider } from './components/ConfirmProvider'
import { Fab } from './components/Fab'
import { ToastProvider } from './components/Toast'
import { BudgetPage } from './features/budget/BudgetPage'
import { useBudgetWarnings } from './features/budget/useBudgetWarnings'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { PwaUpdater } from './features/pwa/PwaUpdater'
import { RecurringPage } from './features/recurring/RecurringPage'
import { useTheme } from './features/settings/theme'
import { LoginDialog } from './features/sync/LoginDialog'
import { cloudEnabled } from './db/db'
import { ThemeContext } from './features/settings/theme-context'
import { useRecurringGenerator } from './features/recurring/useRecurringGenerator'
import { SettingsPage } from './features/settings/SettingsPage'
import { useTransactionEditor } from './features/transactions/editor-context'
import { HistoryPage } from './features/transactions/HistoryPage'
import { TransactionEditorProvider } from './features/transactions/TransactionEditorProvider'
import { currentMonth } from './lib/date'
import type { MonthKey } from './types'

interface PageProps {
  route: Route
  month: MonthKey
  onMonthChange: (month: MonthKey) => void
}

function Page({ route, month, onMonthChange }: PageProps) {
  switch (route) {
    case 'beranda':
      return <DashboardPage month={month} onMonthChange={onMonthChange} />
    case 'riwayat':
      return <HistoryPage />
    case 'anggaran':
      return <BudgetPage month={month} onMonthChange={onMonthChange} />
    case 'berulang':
      return <RecurringPage />
    case 'pengaturan':
      return <SettingsPage />
  }
}

function Shell() {
  const route = useRoute()
  // Bulan terpilih dibagi antara Beranda & Anggaran agar konsisten saat berpindah tab.
  const [month, setMonth] = useState<MonthKey>(() => currentMonth())
  const { openNew } = useTransactionEditor()
  useRecurringGenerator()
  return (
    <>
      <main className="mx-auto min-h-dvh max-w-lg px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Page route={route} month={month} onMonthChange={setMonth} />
      </main>
      {route !== 'pengaturan' && <Fab onClick={() => openNew()} />}
      <BottomNav active={route} />
      <PwaUpdater />
      {cloudEnabled && <LoginDialog />}
    </>
  )
}

/** Editor transaksi yang menampilkan peringatan anggaran setelah pengeluaran disimpan. */
function EditorWithBudgetWarnings({ children }: { children: ReactNode }) {
  const onSaved = useBudgetWarnings()
  return <TransactionEditorProvider onSaved={onSaved}>{children}</TransactionEditorProvider>
}

export default function App() {
  const theme = useTheme()
  return (
    <ThemeContext.Provider value={theme}>
      <ToastProvider>
        <ConfirmProvider>
          <EditorWithBudgetWarnings>
            <Shell />
          </EditorWithBudgetWarnings>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeContext.Provider>
  )
}
