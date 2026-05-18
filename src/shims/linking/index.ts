import {useSyncExternalStore} from 'react'

type Subscription = {
  remove: () => void
}

type UrlEvent = {
  url: string
}

const listeners = new Set<(event: UrlEvent) => void>()

function getHref() {
  return typeof window === 'undefined' ? null : window.location.href
}

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('popstate', listener)
  window.addEventListener('hashchange', listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener('hashchange', listener)
  }
}

export function useLinkingURL(): string | null {
  return useSyncExternalStore(subscribe, getHref, () => null)
}

export async function openURL(url: string): Promise<void> {
  window.location.assign(url)
}

export async function canOpenURL(_url: string): Promise<boolean> {
  return true
}

export async function getInitialURL(): Promise<string | null> {
  return getHref()
}

export function addEventListener(
  type: 'url',
  listener: (event: UrlEvent) => void,
): Subscription {
  if (type === 'url') listeners.add(listener)
  return {
    remove: () => listeners.delete(listener),
  }
}

export function createURL(path: string) {
  return new URL(path, getHref() ?? 'http://localhost').href
}

export function parse(url: string) {
  const parsed = new URL(url, getHref() ?? 'http://localhost')
  return {
    hostname: parsed.hostname,
    path: parsed.pathname.replace(/^\//, ''),
    queryParams: Object.fromEntries(parsed.searchParams.entries()),
    scheme: parsed.protocol.replace(/:$/, ''),
  }
}

export function sendIntent() {
  return Promise.resolve()
}

export function openSettings() {
  return Promise.resolve()
}
