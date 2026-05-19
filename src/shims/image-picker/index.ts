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
  options?: ImagePickerOptions,
): Promise<ImagePickerResult> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = getAccept(options)
    input.multiple = Boolean(
      options?.allowsMultipleSelection ||
      (options?.selectionLimit && options.selectionLimit > 1),
    )
    input.style.display = 'none'

    document.body.appendChild(input)

    const cleanup = () => {
      document.body.removeChild(input)
    }

    let settled = false
    const settle = (result: ImagePickerResult) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }

    input.addEventListener('change', async () => {
      const files = Array.from(input.files ?? [])
      if (files.length === 0) {
        settle({canceled: true, assets: null})
        return
      }

      const limit = options?.selectionLimit
      const selected =
        limit && limit > 0 && input.multiple ? files.slice(0, limit) : files

      try {
        const assets = await Promise.all(
          selected.map(file => fileToAsset(file, options)),
        )
        settle({canceled: false, assets})
      } catch {
        settle({canceled: true, assets: null})
      }
    })

    input.click()
  })
}

export async function requestMediaLibraryPermissionsAsync() {
  return {granted: true, canAskAgain: true, status: 'granted' as const}
}

function getAccept(options?: ImagePickerOptions) {
  const mediaTypes = Array.isArray(options?.mediaTypes)
    ? options.mediaTypes
    : undefined
  const allowsImages = !mediaTypes || mediaTypes.includes('images')
  const allowsVideos = mediaTypes?.includes('videos')

  if (allowsImages && allowsVideos) return 'image/*,video/*'
  if (allowsVideos) return 'video/*'
  return 'image/*'
}

async function fileToAsset(
  file: File,
  options?: ImagePickerOptions,
): Promise<ImagePickerAsset> {
  const uri = await fileToDataUri(file)
  const dimensions = file.type.startsWith('video/')
    ? await getVideoDimensions(file)
    : await getImageDimensions(uri)
  const base64 = options?.base64 ? uri.split(',')[1] || null : null

  return {
    uri,
    file,
    width: dimensions.width,
    height: dimensions.height,
    type: file.type.startsWith('video/') ? 'video' : 'image',
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || undefined,
    duration: dimensions.duration,
    assetId: null,
    base64,
    exif: null,
  }
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Expected file reader result to be a data URI'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(
  uri: string,
): Promise<{width: number; height: number; duration: null}> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        duration: null,
      })
    }
    image.onerror = () => reject(new Error('Failed to load image metadata'))
    image.src = uri
  })
}

function getVideoDimensions(
  file: File,
): Promise<{width: number; height: number; duration: number | null}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : null,
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video metadata'))
    }
    video.src = objectUrl
  })
}
