import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { setBudget } from './features/budget/repository'
import { currentMonth } from './lib/date'
import { resetDatabase } from './test/db-utils'

async function addExpense(user: ReturnType<typeof userEvent.setup>, amount: string, category: string, note = '') {
  await user.click(screen.getByTestId('fab'))
  const dialog = await screen.findByRole('dialog', { name: 'Tambah Transaksi' })
  await user.type(within(dialog).getByLabelText('Jumlah'), amount)
  await user.click(within(dialog).getByRole('radio', { name: category }))
  if (note) await user.type(within(dialog).getByLabelText(/Catatan/), note)
  await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Tambah Transaksi' })).not.toBeInTheDocument())
}

describe('Aplikasi Dompetku', () => {
  beforeEach(resetDatabase)

  it('menampilkan dashboard kosong lalu memperbarui saldo setelah transaksi ditambahkan', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Belum ada transaksi bulan ini')).toBeInTheDocument()
    expect(screen.getByTestId('saldo-bulan')).toHaveTextContent('Rp 0')

    await addExpense(user, '50000', 'Makan', 'Bakso')

    expect(await screen.findByText('Pengeluaran dicatat.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('total-pengeluaran')).toHaveTextContent('Rp 50.000'))
    expect(screen.getByTestId('saldo-bulan')).toHaveTextContent('-Rp 50.000')
    expect(screen.getByText('Bakso')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Rincian pengeluaran per kategori' })).toHaveTextContent('Makan')
  })

  it('memperingatkan saat anggaran mencapai 80% dan saat terlampaui', async () => {
    const user = userEvent.setup()
    await setBudget(currentMonth(), 'cat-makan', 100_000)
    render(<App />)
    await screen.findByText('Belum ada transaksi bulan ini')

    await addExpense(user, '85000', 'Makan')
    expect(await screen.findByText('Anggaran Makan sudah 85% terpakai (sisa Rp 15.000)', { selector: 'p' })).toBeInTheDocument()

    await addExpense(user, '20000', 'Makan')
    expect(await screen.findByText('Anggaran Makan terlampaui Rp 5.000', { selector: 'p' })).toBeInTheDocument()
    // Peringatan juga tampil di Beranda.
    expect(await screen.findByRole('alert')).toHaveTextContent('Anggaran Makan terlampaui Rp 5.000')
  })

  it('mengubah dan menghapus transaksi dari riwayat, dengan pencarian', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Belum ada transaksi bulan ini')
    await addExpense(user, '25000', 'Makan', 'Nasi goreng')
    await addExpense(user, '150000', 'Transportasi', 'Bensin')

    act(() => {
      window.location.hash = '#/riwayat'
    })
    expect(await screen.findByRole('heading', { name: 'Riwayat' })).toBeInTheDocument()
    await screen.findByText('Bensin')

    await user.type(screen.getByLabelText('Cari transaksi'), 'nasi')
    await waitFor(() => expect(screen.queryByText('Bensin')).not.toBeInTheDocument())
    expect(screen.getByText('Nasi goreng')).toBeInTheDocument()

    // Ubah jumlah
    await user.click(screen.getByText('Nasi goreng'))
    const dialog = await screen.findByRole('dialog', { name: 'Ubah Transaksi' })
    const amount = within(dialog).getByLabelText('Jumlah')
    await user.clear(amount)
    await user.type(amount, '30000')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByText('Transaksi diperbarui.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('-Rp 30.000').length).toBeGreaterThan(0))

    // Hapus dengan konfirmasi
    await user.click(screen.getByText('Nasi goreng'))
    await user.click(within(await screen.findByRole('dialog', { name: 'Ubah Transaksi' })).getByRole('button', { name: 'Hapus transaksi' }))
    const confirmDialog = await screen.findByRole('alertdialog', { name: 'Hapus transaksi?' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Hapus' }))
    expect(await screen.findByText('Transaksi dihapus.')).toBeInTheDocument()
    expect(await screen.findByText('Tidak ada hasil')).toBeInTheDocument()

    // Urungkan
    await user.click(screen.getByRole('button', { name: 'Urungkan' }))
    expect(await screen.findByText('Nasi goreng')).toBeInTheDocument()
  })

  it('beralih ke mode gelap dari Beranda', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Gunakan mode gelap' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('dompetku-theme')).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Gunakan mode terang' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
