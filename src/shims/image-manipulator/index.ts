export enum SaveFormat {
  JPEG = 'jpeg',
  PNG = 'png',
}

export type ActionCrop = {
  crop: {
    originX: number
    originY: number
    width: number
    height: number
  }
}

export type ActionResize = {
  resize: {
    width?: number
    height?: number
  }
}

export type Action = ActionCrop | ActionResize

export type ManipulateOptions = {
  compress?: number
  format?: SaveFormat
  base64?: boolean
}

export async function manipulateAsync(
  uri: string,
  _actions: Action[] = [],
  _options: ManipulateOptions = {},
) {
  const size = await getImageSize(uri).catch(() => ({width: 0, height: 0}))
  return {uri, width: size.width, height: size.height, base64: undefined}
}

export const ImageManipulator = {
  manipulate(uri: string) {
    return {
      resize(_size?: unknown) {
        return this
      },
      crop(_rect?: unknown) {
        return this
      },
      async renderAsync() {
        const result = await manipulateAsync(uri)
        return {
          width: result.width,
          height: result.height,
          async saveAsync(_options?: ManipulateOptions) {
            return result
          },
        }
      },
    }
  },
}

function getImageSize(src: string): Promise<{width: number; height: number}> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.onload = () => resolve({width: image.naturalWidth, height: image.naturalHeight})
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })
}
