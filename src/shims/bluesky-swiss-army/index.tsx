import {type ReactNode} from 'react'

type GooglePlayReferrerInfo = {
  installReferrer?: string
  clickTimestamp?: number
  installTimestamp?: number
}

export enum AudioCategory {
  Ambient = 'AVAudioSessionCategoryAmbient',
  Playback = 'AVAudioSessionCategoryPlayback',
}

export const PlatformInfo = {
  getIsReducedMotionEnabled() {
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  },
  setAudioActive(_active: boolean) {},
  setAudioCategory(_audioCategory: AudioCategory) {},
}

export const Referrer = {
  async getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
    return null
  },
  getReferrerInfo() {
    if (typeof document === 'undefined' || !document.referrer) return null
    try {
      const url = new URL(document.referrer)
      return {referrer: url.href, hostname: url.hostname}
    } catch {
      return {referrer: document.referrer, hostname: document.referrer}
    }
  },
}

const store = new Map<string, string | number | boolean | null | undefined>()

export const SharedPrefs = {
  setValue(key: string, value: string | number | boolean | null | undefined) {
    store.set(key, value)
  },
  removeValue(key: string) {
    store.delete(key)
  },
  getString(key: string) {
    const value = store.get(key)
    return typeof value === 'string' ? value : undefined
  },
  getNumber(key: string) {
    const value = store.get(key)
    return typeof value === 'number' ? value : undefined
  },
  getBool(key: string) {
    const value = store.get(key)
    return typeof value === 'boolean' ? value : undefined
  },
  addToSet(_key: string, _value: string) {},
  removeFromSet(_key: string, _value: string) {},
  setContains(_key: string, _value: string) {
    return false
  },
}

export async function updateActiveViewAsync() {}

export default function VisibilityView({
  children,
}: {
  children: ReactNode
  enabled?: boolean
  onChangeStatus?: (isActive: boolean) => void
}) {
  return <>{children}</>
}
