import type { DXCAlert, DXCUserInteraction } from 'dexie-cloud-addon'
import { describe, expect, it } from 'vitest'
import { alertText, describeSyncStatus, interactionTexts } from './texts'

const loggedIn = { isLoggedIn: true }

describe('describeSyncStatus', () => {
  it('belum masuk', () => {
    expect(describeSyncStatus(undefined, { isLoggedIn: false })).toMatchObject({ tone: 'idle' })
  })

  it('memetakan fase sinkronisasi', () => {
    expect(describeSyncStatus({ status: 'connected', phase: 'in-sync' }, loggedIn)).toEqual({ label: 'Tersinkron', tone: 'ok' })
    expect(describeSyncStatus({ status: 'connected', phase: 'pushing' }, loggedIn).tone).toBe('busy')
    expect(describeSyncStatus({ status: 'offline', phase: 'offline' }, loggedIn).tone).toBe('offline')
    expect(describeSyncStatus({ status: 'error', phase: 'error', error: new Error('Network') }, loggedIn)).toEqual({
      label: 'Gagal sinkron: Network',
      tone: 'error',
    })
  })

  it('lisensi uji coba habis', () => {
    expect(describeSyncStatus({ status: 'connected', phase: 'in-sync', license: 'expired' }, loggedIn).tone).toBe('error')
  })
})

describe('teks login', () => {
  it('menerjemahkan pesan yang dikenal dan mengisi parameter', () => {
    const sent: DXCAlert = {
      type: 'info',
      messageCode: 'OTP_SENT',
      message: 'A One-Time password has been sent to {email}',
      messageParams: { email: 'a@b.id' },
    }
    expect(alertText(sent)).toBe('Kode masuk sudah dikirim ke a@b.id. Cek kotak masuk atau folder spam.')
    const generic: DXCAlert = { type: 'error', messageCode: 'GENERIC_ERROR', message: 'Something broke', messageParams: {} }
    expect(alertText(generic)).toBe('Something broke')
    const offline: DXCAlert = {
      type: 'error',
      messageCode: 'GENERIC_ERROR',
      message: 'Could not connect to server. Please verify…',
      messageParams: {},
    }
    expect(alertText(offline)).toMatch(/^Tidak bisa terhubung ke server sinkronisasi/)
  })

  it('judul & tombol berbahasa Indonesia', () => {
    const prompt = {
      type: 'email',
      title: 'Log in',
      alerts: [],
      fields: {},
      submitLabel: 'Send OTP',
      cancelLabel: 'Cancel',
    } as unknown as DXCUserInteraction
    expect(interactionTexts(prompt)).toMatchObject({ title: 'Masuk untuk sinkronisasi', submitLabel: 'Kirim kode', cancelLabel: 'Batal' })
  })
})
