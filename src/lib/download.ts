/** Mengunduh teks sebagai file di browser. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Beri waktu browser memulai unduhan sebelum URL dilepas.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
