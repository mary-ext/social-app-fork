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
  actions: Action[] = [],
  options: ManipulateOptions = {},
) {
  const image = await loadImage(uri)
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight
  let outputWidth = sourceWidth
  let outputHeight = sourceHeight

  for (const action of actions) {
    if ('crop' in action) {
      sourceX = action.crop.originX
      sourceY = action.crop.originY
      sourceWidth = action.crop.width
      sourceHeight = action.crop.height
      outputWidth = action.crop.width
      outputHeight = action.crop.height
    } else if ('resize' in action) {
      const {width, height} = action.resize
      if (width && height) {
        outputWidth = width
        outputHeight = height
      } else if (width) {
        outputWidth = width
        outputHeight = Math.round((sourceHeight / sourceWidth) * width)
      } else if (height) {
        outputHeight = height
        outputWidth = Math.round((sourceWidth / sourceHeight) * height)
      }
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create image manipulation canvas')
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  const mimeType =
    options.format === SaveFormat.PNG ? 'image/png' : 'image/jpeg'
  const resultUri = canvas.toDataURL(mimeType, options.compress)
  const base64 = options.base64 ? resultUri.split(',')[1] : undefined

  return {
    uri: resultUri,
    width: outputWidth,
    height: outputHeight,
    base64,
  }
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })
}
