import { useEffect, useState } from 'react'

export type Route = 'beranda' | 'riwayat' | 'anggaran' | 'berulang' | 'pengaturan'

export const ROUTES: readonly Route[] = ['beranda', 'riwayat', 'anggaran', 'berulang', 'pengaturan']

/** Hash → rute. Router berbasis hash agar aman di GitHub Pages (tanpa rewrite server). */
export function parseRoute(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'beranda'
}

export function routeHref(route: Route): string {
  return route === 'beranda' ? '#/' : `#/${route}`
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route)
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
