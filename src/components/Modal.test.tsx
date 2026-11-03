import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('tidak dirender saat tertutup', () => {
    render(
      <Modal open={false} title="Judul" onClose={() => {}}>
        isi
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape hanya menutup modal teratas', async () => {
    const user = userEvent.setup()
    const closeOuter = vi.fn()
    const closeInner = vi.fn()
    render(
      <>
        <Modal open title="Luar" onClose={closeOuter}>
          luar
        </Modal>
        <Modal open title="Dalam" onClose={closeInner} variant="dialog">
          dalam
        </Modal>
      </>,
    )
    expect(screen.getByRole('dialog', { name: 'Luar' })).toBeInTheDocument()
    expect(screen.getByRole('alertdialog', { name: 'Dalam' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(closeInner).toHaveBeenCalledTimes(1)
    expect(closeOuter).not.toHaveBeenCalled()
  })

  it('tombol Tutup memanggil onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open title="Judul" onClose={onClose}>
        isi
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(onClose).toHaveBeenCalled()
  })
})
