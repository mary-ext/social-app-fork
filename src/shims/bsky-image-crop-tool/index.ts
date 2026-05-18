export type OpenCropperOptions = {
  imageUri: string
  aspectRatio?: number
  cancelButtonText?: string
  doneButtonText?: string
  format?: 'jpeg' | 'png'
  shape?: 'circle' | 'rectangle'
}

export async function openCropper(options: OpenCropperOptions) {
  return {
    path: options.imageUri,
    width: 0,
    height: 0,
    mime: 'image/jpeg',
    mimeType: 'image/jpeg',
    size: 0,
  }
}

export default {
  openCropper,
  openCropperAsync: openCropper,
}
