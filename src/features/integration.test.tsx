import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { db } from '../db/db'
import { addMonths, currentMonth } from '../lib/date'
import { resetDatabase } from '../test/db-utils'
import { makeTx } from '../test/fixtures'
import { createBackup, serializeBackup } from './backup/backup'
import kiriman from './mbappe/__fixtures__/kiriman-markas-mbappe.json'

function goTo(hash: string) {
  act(() => {
    window.location.hash = hash
  })
}

describe('Integrasi halaman', () => {
  beforeEach(resetDatabase)

  it('membuat transaksi berulang dan langsung mencatat bulan yang sudah jatuh tempo', async () => {
    const user = userEvent.setup()
    goTo('#/berulang')
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Tambah transaksi berulang/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Transaksi Berulang Baru' })
    await user.type(within(dialog).getByLabelText('Nama / catatan'), 'Internet')
    await user.type(within(dialog).getByLabelText('Jumlah per bulan'), '300000')
    await user.click(within(dialog).getByRole('radio', { name: 'Tagihan' }))
    await user.selectOptions(within(dialog).getByLabelText('Tanggal setiap bulan'), '1')
    await user.selectOptions(within(dialog).getByLabelText('Mulai bulan'), addMonths(currentMonth(), -2))
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))

    // Tanggal 1 sudah lewat untuk 3 bulan (2 bulan lalu, bulan lalu, bulan ini).
    expect(await screen.findByText('3 transaksi berulang yang sudah jatuh tempo ditambahkan.')).toBeInTheDocument()
    expect(await db.transactions.count()).toBe(3)
    expect(screen.getByText('Internet')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Jeda Internet' })).toBeChecked()

    await user.click(screen.getByRole('switch', { name: 'Jeda Internet' }))
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Aktifkan Internet' })).not.toBeChecked())
  })

  it('mengimpor backup JSON dengan mode gabung', async () => {
    const user = userEvent.setup()
    await db.transactions.add(makeTx({ id: 'lama', note: 'Data lama', date: `${currentMonth()}-01` }))
    goTo('#/pengaturan')
    render(<App />)
    await screen.findByRole('heading', { name: 'Backup & Restore' })

    const backup = createBackup({
      categories: [],
      transactions: [makeTx({ id: 'baru', note: 'Dari backup', amount: 12345 })],
      budgets: [],
      recurring: [],
    })
    const file = new File([serializeBackup(backup)], 'backup.json', { type: 'application/json' })
    await user.upload(screen.getByTestId('import-input'), file)

    const dialog = await screen.findByRole('dialog', { name: 'Pulihkan backup' })
    await user.click(within(dialog).getByRole('button', { name: 'Gabungkan dengan data sekarang' }))
    expect(await screen.findByText('Data berhasil dipulihkan (1 transaksi).')).toBeInTheDocument()
    expect((await db.transactions.toArray()).map((t) => t.id).sort()).toEqual(['baru', 'lama'])
  })

  it('menolak file backup yang tidak valid', async () => {
    const user = userEvent.setup()
    goTo('#/pengaturan')
    render(<App />)
    await screen.findByRole('heading', { name: 'Backup & Restore' })
    await user.upload(screen.getByTestId('import-input'), new File(['bukan json'], 'x.json', { type: 'application/json' }))
    expect(await screen.findByText('File bukan JSON yang valid.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Pulihkan backup' })).not.toBeInTheDocument()
  })

  it('menambah kategori kustom dan memakainya di form transaksi', async () => {
    const user = userEvent.setup()
    goTo('#/pengaturan')
    render(<App />)
    const section = (await screen.findByRole('heading', { name: 'Kategori' })).closest('section')!
    await user.click(within(section).getByRole('button', { name: 'Tambah' }))
    const dialog = await screen.findByRole('dialog', { name: 'Kategori Baru' })
    await user.type(within(dialog).getByLabelText('Nama kategori'), 'Kopi')
    await user.click(within(dialog).getByRole('radio', { name: 'Kopi' }))
    await user.click(within(dialog).getByRole('button', { name: 'Simpan kategori' }))
    expect(await screen.findByText('Kategori "Kopi" ditambahkan.')).toBeInTheDocument()

    goTo('#/')
    await user.click(await screen.findByTestId('fab'))
    const form = await screen.findByRole('dialog', { name: 'Tambah Transaksi' })
    expect(within(form).getByRole('radio', { name: 'Kopi' })).toBeInTheDocument()
  })

  it('menerima pemasukan dari Markas Mbappe di Pengaturan dan tidak dobel saat diulang', async () => {
    const user = userEvent.setup()
    goTo('#/pengaturan')
    render(<App />)
    await screen.findByRole('heading', { name: 'Sambungan Markas Mbappe' })
    const file = () => new File([JSON.stringify(kiriman)], 'mbappe-ke-dompetku.json', { type: 'application/json' })

    await user.upload(screen.getByTestId('mbappe-input'), file())
    const dialog = await screen.findByRole('alertdialog', { name: 'Terima pemasukan dari Markas Mbappe?' })
    await user.click(within(dialog).getByRole('button', { name: 'Terima' }))
    expect(await screen.findByText('Pemasukan Markas Mbappe diterima: 3 baru, 0 diperbarui.')).toBeInTheDocument()
    expect(await db.transactions.count()).toBe(3)

    await user.upload(screen.getByTestId('mbappe-input'), file())
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Terima' }))
    expect(await screen.findByText('Pemasukan Markas Mbappe diterima: 0 baru, 3 diperbarui.')).toBeInTheDocument()
    expect(await db.transactions.count()).toBe(3)
  })

  it('file Markas Mbappe lewat Import JSON tidak menawarkan "Ganti semua"', async () => {
    const user = userEvent.setup()
    goTo('#/pengaturan')
    render(<App />)
    await screen.findByRole('heading', { name: 'Backup & Restore' })
    await user.upload(screen.getByTestId('import-input'), new File([JSON.stringify(kiriman)], 'x.json', { type: 'application/json' }))
    expect(await screen.findByRole('alertdialog', { name: 'Terima pemasukan dari Markas Mbappe?' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ganti semua data' })).not.toBeInTheDocument()
  })
})
