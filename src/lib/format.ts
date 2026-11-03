/** Jumlah digit maksimum untuk nominal (≈ 999 triliun) agar tetap aman sebagai bilangan bulat JS. */
export const MAX_AMOUNT_DIGITS = 15

/** Mengelompokkan digit dengan titik: 1250000 → "1.250.000". */
export function formatThousands(value: number): string {
  const digits = Math.round(Math.abs(value)).toString()
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Format Rupiah: 1250000 → "Rp 1.250.000", -5000 → "-Rp 5.000".
 * Rupiah ditampilkan tanpa desimal (dibulatkan).
 */
export function formatRupiah(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '-' : ''
  return `${sign}Rp ${formatThousands(rounded)}`
}

/** Format ringkas untuk sumbu grafik: 1.500.000 → "1,5 jt", 250.000 → "250 rb". */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',')
  if (abs >= 1_000_000_000) return `${sign}${fmt(abs / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `${sign}${fmt(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000)} rb`
  return `${sign}${Math.round(abs)}`
}

/**
 * Mengubah teks masukan pengguna menjadi angka Rupiah.
 * Semua karakter non-digit diabaikan ("Rp 1.250.000" → 1250000).
 * Mengembalikan 0 untuk masukan kosong.
 */
export function parseAmount(input: string): number {
  const digits = input.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS)
  return digits === '' ? 0 : Number(digits)
}

/** Memformat teks masukan saat diketik: "1250000" → "1.250.000". Kosong tetap kosong. */
export function formatAmountInput(input: string): string {
  const digits = input
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, MAX_AMOUNT_DIGITS)
  return digits === '' ? '' : formatThousands(Number(digits))
}

/** Persentase dibulatkan, mis. 0.8567 → "86%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}
