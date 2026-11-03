import { describe, expect, it } from 'vitest'
import { applyTheme, getThemePreference, resolveTheme, THEME_STORAGE_KEY } from './theme'

describe('tema', () => {
  it('menerjemahkan preferensi "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('membaca preferensi tersimpan dengan fallback "system"', () => {
    expect(getThemePreference()).toBe('system')
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(getThemePreference()).toBe('dark')
    localStorage.setItem(THEME_STORAGE_KEY, 'ungu')
    expect(getThemePreference()).toBe('system')
  })

  it('menerapkan kelas dark pada <html>', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
