type PermissionResponse = {
  granted: boolean
  canAskAgain: boolean
  status: 'granted' | 'denied' | 'undetermined'
}

const granted: PermissionResponse = {
  granted: true,
  canAskAgain: true,
  status: 'granted',
}

export function usePermissions(_options?: unknown): [
  PermissionResponse,
  () => Promise<PermissionResponse>,
  () => Promise<PermissionResponse>,
] {
  return [granted, async () => granted, async () => granted]
}

export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  return granted
}

export async function createAssetAsync(uri: string, _album?: unknown) {
  return {uri}
}

export async function saveToLibraryAsync(_uri: string): Promise<void> {}
export async function getAlbumAsync(_name: string): Promise<null> {
  return null
}
export async function createAlbumAsync(..._args: unknown[]) {
  return null
}
export async function albumNeedsMigrationAsync(
  _album?: unknown,
): Promise<boolean> {
  return false
}
export async function migrateAlbumIfNeededAsync(
  _album?: unknown,
): Promise<void> {}
