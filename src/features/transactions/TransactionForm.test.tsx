import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CATEGORIES } from '../categories/defaults'
import { makeTx } from '../../test/fixtures'
import { TransactionForm } from './TransactionForm'

describe('TransactionForm', () => {
  it('mengirim transaksi pengeluaran baru dengan nominal terformat', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TransactionForm categories={DEFAULT_CATEGORIES} onSubmit={onSubmit} defaults={{ date: '2026-11-03' }} />)

    const amount = screen.getByLabelText('Jumlah')
    await user.type(amount, '1250000')
    expect(amount).toHaveValue('1.250.000')

    await user.click(screen.getByRole('radio', { name: /Makan/ }))
    await user.type(screen.getByLabelText(/Catatan/), 'Belanja bulanan')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'expense',
      amount: 1250000,
      categoryId: '#cat-makan',
      date: '2026-11-03',
      note: 'Belanja bulanan',
    })
  })

  it('menampilkan pesan galat bila jumlah kosong atau kategori belum dipilih', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TransactionForm categories={DEFAULT_CATEGORIES} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Jumlah harus lebih dari 0.')

    await user.type(screen.getByLabelText('Jumlah'), '5000')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Pilih kategori terlebih dahulu.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('hanya menampilkan kategori yang sesuai jenis transaksi', async () => {
    const user = userEvent.setup()
    render(<TransactionForm categories={DEFAULT_CATEGORIES} onSubmit={vi.fn()} />)

    expect(screen.queryByRole('radio', { name: /Gaji/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Pemasukan' }))
    expect(screen.getByRole('radio', { name: /Gaji/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Makan/ })).not.toBeInTheDocument()
    // "Lainnya" berlaku untuk keduanya
    expect(screen.getByRole('radio', { name: /Lainnya/ })).toBeInTheDocument()
  })

  it('mengisi nilai awal saat mengubah transaksi', () => {
    const tx = makeTx({ amount: 75000, categoryId: '#cat-hiburan', note: 'Bioskop', date: '2026-10-01' })
    render(<TransactionForm categories={DEFAULT_CATEGORIES} initial={tx} onSubmit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByLabelText('Jumlah')).toHaveValue('75.000')
    expect(screen.getByLabelText(/Catatan/)).toHaveValue('Bioskop')
    expect(screen.getByRole('radio', { name: /Hiburan/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Hapus transaksi' })).toBeInTheDocument()
  })
})
