export enum OrientationLock {
  PORTRAIT_UP = 'PORTRAIT_UP',
}

export async function lockAsync(_orientation: OrientationLock): Promise<void> {}
export async function unlockAsync(): Promise<void> {}
