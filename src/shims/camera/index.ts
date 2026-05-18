type PermissionResponse = {
  granted: boolean
  canAskAgain: boolean
  status: 'granted' | 'denied' | 'undetermined'
}

const denied: PermissionResponse = {
  granted: false,
  canAskAgain: false,
  status: 'denied',
}

export function useCameraPermissions(): [
  PermissionResponse,
  () => Promise<PermissionResponse>,
] {
  return [denied, async () => denied]
}
