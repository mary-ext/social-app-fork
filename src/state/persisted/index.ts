import {EventEmitter} from 'eventemitter3'

import BroadcastChannel from '#/lib/broadcast'
import {logger} from '#/logger'
import {
  defaults,
  type Schema,
  tryParse,
  tryStringify,
} from '#/state/persisted/schema'
import {device} from '#/storage'
import {type PersistedApi} from './types'
import {normalizeData} from './util'

export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'
const UPDATE_EVENT = 'BSKY_UPDATE'

const broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL')

let _state: Schema = defaults
const _emitter = new EventEmitter()

// async, to match the public persisted storage API
// eslint-disable-next-line @typescript-eslint/require-await
export async function init() {
  broadcast.onmessage = onBroadcastMessage
  globalThis.addEventListener?.('storage', onStorage)
  const stored = readFromStorage()
  if (stored) {
    _state = stored
  }
}
init satisfies PersistedApi['init']

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
get satisfies PersistedApi['get']

// eslint-disable-next-line @typescript-eslint/require-await
export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  const next = readFromStorage()
  if (next) {
    // Apply this write on top of the latest valid localStorage state.
    _state = next
  }
  try {
    if (JSON.stringify({v: _state[key]}) === JSON.stringify({v: value})) {
      return
    }
  } catch {
    // Ignore and go through the normal write path.
  }
  _state = normalizeData({
    ..._state,
    [key]: value,
  })
  writeToStorage(_state)
  broadcast.postMessage({event: {type: UPDATE_EVENT, key}})
  broadcast.postMessage({event: UPDATE_EVENT}) // Backcompat while upgrading
  _emitter.emit('update:' + String(key))
  _emitter.emit('update')
}
write satisfies PersistedApi['write']

export function onUpdate<K extends keyof Schema>(
  key: K,
  cb: (v: Schema[K]) => void,
): () => void {
  const listener = () => cb(get(key))
  _emitter.addListener('update', listener) // Backcompat while upgrading
  _emitter.addListener('update:' + String(key), listener)
  return () => {
    _emitter.removeListener('update', listener) // Backcompat while upgrading
    _emitter.removeListener('update:' + String(key), listener)
  }
}
onUpdate satisfies PersistedApi['onUpdate']

// eslint-disable-next-line @typescript-eslint/require-await
export async function clearStorage() {
  try {
    localStorage.removeItem(BSKY_STORAGE)
    device.removeAll()
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
clearStorage satisfies PersistedApi['clearStorage']

function onStorage(event: StorageEvent) {
  if (event.storageArea !== localStorage || event.key !== BSKY_STORAGE) {
    return
  }
  applyStoredState()
}

// eslint-disable-next-line @typescript-eslint/require-await
async function onBroadcastMessage({data}: MessageEvent) {
  if (
    typeof data === 'object' &&
    (data.event === UPDATE_EVENT || data.event?.type === UPDATE_EVENT)
  ) {
    applyStoredState(
      typeof data.event.key === 'string' ? data.event.key : undefined,
    )
  }
}

function applyStoredState(key?: string) {
  const next = readFromStorage()
  if (next === _state) {
    return
  }
  if (next) {
    _state = next
    if (key) {
      _emitter.emit('update:' + key)
    } else {
      _emitter.emit('update')
    }
  } else {
    logger.error(`persisted state: handled update but found no data`)
  }
}

function writeToStorage(value: Schema) {
  const rawData = tryStringify(value)
  if (rawData) {
    try {
      localStorage.setItem(BSKY_STORAGE, rawData)
    } catch {
      // Expected in restricted/private modes or quota exhaustion.
    }
  }
}

let lastRawData: string | undefined
let lastResult: Schema | undefined
function readFromStorage(): Schema | undefined {
  let rawData: string | null = null
  try {
    rawData = localStorage.getItem(BSKY_STORAGE)
  } catch {
    // Expected in restricted/private modes.
  }
  if (rawData) {
    if (rawData === lastRawData) {
      return lastResult
    } else {
      const result = tryParse(rawData)
      if (result) {
        lastRawData = rawData
        lastResult = normalizeData(result)
        return lastResult
      }
    }
  }
}
