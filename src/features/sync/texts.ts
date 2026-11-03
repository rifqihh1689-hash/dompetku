import type { DXCAlert, DXCInputField, DXCUserInteraction, SyncState, UserLogin } from 'dexie-cloud-addon'

/** Teks Bahasa Indonesia untuk tiap jenis dialog login Dexie Cloud. */
export interface InteractionTexts {
  title: string
  submitLabel: string
  cancelLabel: string | null
  fieldLabels: Record<string, string>
  fieldPlaceholders: Record<string, string>
}

export function interactionTexts(interaction: DXCUserInteraction): InteractionTexts {
  switch (interaction.type) {
    case 'email':
      return {
        title: 'Masuk untuk sinkronisasi',
        submitLabel: 'Kirim kode',
        cancelLabel: 'Batal',
        fieldLabels: { email: 'Email' },
        fieldPlaceholders: { email: 'nama@email.com' },
      }
    case 'otp':
      return {
        title: 'Masukkan kode',
        submitLabel: 'Masuk',
        cancelLabel: 'Batal',
        fieldLabels: { otp: 'Kode dari email' },
        fieldPlaceholders: { otp: '' },
      }
    case 'logout-confirmation':
      return {
        title: 'Keluar dari sinkronisasi?',
        submitLabel: 'Tetap keluar',
        cancelLabel: 'Batal',
        fieldLabels: {},
        fieldPlaceholders: {},
      }
    case 'message-alert':
      return {
        title: interaction.alerts.some((a) => a.type === 'error') ? 'Terjadi masalah' : 'Informasi',
        submitLabel: 'OK',
        cancelLabel: null,
        fieldLabels: {},
        fieldPlaceholders: {},
      }
    default: {
      const fields = Object.entries(interaction.fields as Record<string, DXCInputField>)
      return {
        title: interaction.title,
        submitLabel: interaction.submitLabel,
        cancelLabel: interaction.cancelLabel,
        fieldLabels: Object.fromEntries(fields.map(([k, f]) => [k, f.label ?? k])),
        fieldPlaceholders: Object.fromEntries(fields.map(([k, f]) => [k, f.placeholder ?? ''])),
      }
    }
  }
}

const ALERT_TEXTS: Partial<Record<DXCAlert['messageCode'], string>> = {
  OTP_SENT: 'Kode masuk sudah dikirim ke {email}. Cek kotak masuk atau folder spam.',
  INVALID_OTP: 'Kode salah atau sudah kedaluwarsa. Coba lagi.',
  INVALID_EMAIL: 'Alamat email tidak valid.',
  LICENSE_LIMIT_REACHED: 'Batas pengguna sinkronisasi sudah penuh. Hubungi pemilik aplikasi.',
  NO_SEATS_AVAILABLE: 'Batas pengguna sinkronisasi sudah penuh. Hubungi pemilik aplikasi.',
  USER_NOT_REGISTERED: 'Email ini belum terdaftar untuk sinkronisasi. Hubungi pemilik aplikasi.',
  USER_NOT_ACCEPTED: 'Email ini belum diizinkan untuk sinkronisasi. Hubungi pemilik aplikasi.',
  USER_DEACTIVATED: 'Akun ini sudah dinonaktifkan.',
  LOGOUT_CONFIRMATION: 'Ada perubahan yang belum terkirim ke cloud. Jika keluar sekarang, perubahan itu akan hilang dari perangkat ini.',
}

/** Pesan umum (GENERIC_*) yang dikenali dari isinya. */
const GENERIC_PATTERNS: [RegExp, string][] = [
  [
    /could not connect to server|failed to fetch|network/i,
    'Tidak bisa terhubung ke server sinkronisasi. Periksa koneksi internet, lalu coba lagi. Jika masih gagal, pemilik aplikasi perlu mendaftarkan alamat aplikasi ini di Dexie Cloud (whitelist).',
  ],
]

/** Menerjemahkan pesan dari Dexie Cloud; pesan yang tidak dikenal ditampilkan apa adanya. */
export function alertText(alert: DXCAlert): string {
  const generic = GENERIC_PATTERNS.find(([pattern]) => pattern.test(alert.message))?.[1]
  const template = ALERT_TEXTS[alert.messageCode] ?? generic ?? alert.message
  return template.replace(/\{(\w+)\}/g, (_, key: string) => alert.messageParams?.[key] ?? '')
}

export type SyncTone = 'ok' | 'busy' | 'offline' | 'error' | 'idle'

export interface SyncStatusInfo {
  label: string
  tone: SyncTone
}

/** Ringkasan status sinkronisasi untuk ditampilkan ke pengguna. */
export function describeSyncStatus(
  state: SyncState | undefined,
  user: Pick<UserLogin, 'isLoggedIn' | 'license'> | undefined,
): SyncStatusInfo {
  if (!user?.isLoggedIn) return { label: 'Belum masuk — data hanya tersimpan di perangkat ini', tone: 'idle' }
  const license = state?.license ?? user.license?.status
  if (license === 'expired') return { label: 'Masa uji coba akun habis — sinkronisasi berhenti', tone: 'error' }
  if (license === 'deactivated') return { label: 'Akun dinonaktifkan — sinkronisasi berhenti', tone: 'error' }
  if (!state) return { label: 'Menyiapkan sinkronisasi…', tone: 'busy' }
  if (state.phase === 'error' || state.status === 'error') {
    return { label: `Gagal sinkron${state.error?.message ? `: ${state.error.message}` : ''}`, tone: 'error' }
  }
  if (state.phase === 'offline' || state.status === 'offline') {
    return { label: 'Offline — perubahan dikirim otomatis saat online', tone: 'offline' }
  }
  if (state.phase === 'pushing' || state.phase === 'pulling' || state.status === 'connecting') {
    return { label: 'Menyinkronkan…', tone: 'busy' }
  }
  if (state.phase === 'in-sync') return { label: 'Tersinkron', tone: 'ok' }
  return { label: 'Menunggu sinkronisasi…', tone: 'busy' }
}
