import { useState } from 'react'
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
      return <ComingSoon title="Anggaran" />
    case 'berulang':
      return <ComingSoon title="Transaksi Berulang" />
    case 'pengaturan':
      return <SettingsPage />
  }
}

function Shell() {
  const route = useRoute()
  // Bulan terpilih dibagi antara Beranda & Anggaran agar konsisten saat berpindah tab.
  const [month, setMonth] = useState<MonthKey>(() => currentMonth())
  const { openNew } = useTransactionEditor()
  return (
    <>
      <main className="mx-auto min-h-dvh max-w-lg px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Page route={route} month={month} onMonthChange={setMonth} />
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
