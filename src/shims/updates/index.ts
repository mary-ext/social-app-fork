export const isEnabled = false

type RunningUpdate = {
  channel?: string
}

export function useUpdates(): {
  currentlyRunning: RunningUpdate | null
  isUpdateAvailable: boolean
  isUpdatePending: boolean
} {
  return {
    currentlyRunning: null,
    isUpdateAvailable: false,
    isUpdatePending: false,
  }
}

export async function setExtraParamAsync(
  _key: string,
  _value: string | null,
): Promise<void> {}

export async function checkForUpdateAsync() {
  return {isAvailable: false}
}

export async function fetchUpdateAsync() {
  return {isNew: false}
}

export async function reloadAsync(): Promise<void> {}
