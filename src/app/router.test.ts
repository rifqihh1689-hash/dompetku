import { describe, expect, it } from 'vitest'
import { parseRoute, routeHref } from './router'

describe('router', () => {
  it('menerjemahkan hash menjadi rute', () => {
    expect(parseRoute('')).toBe('beranda')
    expect(parseRoute('#/')).toBe('beranda')
    expect(parseRoute('#/riwayat')).toBe('riwayat')
    expect(parseRoute('#/anggaran?x=1')).toBe('anggaran')
    expect(parseRoute('#/tidak-ada')).toBe('beranda')
  })

  it('membuat href', () => {
    expect(routeHref('beranda')).toBe('#/')
    expect(routeHref('pengaturan')).toBe('#/pengaturan')
  })
})
