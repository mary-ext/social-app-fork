export type ImagePickerAsset = {
  uri: string
  file?: File
  width: number
  height: number
  type?: 'image' | 'video' | 'livePhoto' | 'pairedVideo'
  fileName?: string | null
  fileSize?: number
  mimeType?: string
  duration?: number | null
  assetId?: string | null
  base64?: string | null
  exif?: Record<string, unknown> | null
}

export type ImagePickerResult =
  | {canceled: true; assets: null}
  | {canceled: false; assets: ImagePickerAsset[]}

export type ImagePickerOptions = {
  allowsEditing?: boolean
  allowsMultipleSelection?: boolean
  aspect?: [number, number]
  base64?: boolean
  exif?: boolean
  mediaTypes?: unknown
  orderedSelection?: boolean
  preferredAssetRepresentationMode?: unknown
  quality?: number
  selectionLimit?: number
  legacy?: boolean
  videoExportPreset?: unknown
  videoMaxDuration?: number
}

export enum UIImagePickerPreferredAssetRepresentationMode {
  Automatic = 'automatic',
  Current = 'current',
}

export enum VideoExportPreset {
  Passthrough = 'passthrough',
}

export async function launchCameraAsync(
  _options?: ImagePickerOptions,
): Promise<ImagePickerResult> {
  return {canceled: true, assets: null}
}

export async function launchImageLibraryAsync(
  _options?: ImagePickerOptions,
): Promise<ImagePickerResult> {
  return {canceled: true, assets: null}
}

export async function requestMediaLibraryPermissionsAsync() {
  return {granted: true, canAskAgain: true, status: 'granted' as const}
}
