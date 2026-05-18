export const cacheDirectory = 'web-cache://'
export const documentDirectory = 'web-document://'

export enum EncodingType {
  Base64 = 'base64',
  UTF8 = 'utf8',
}

export enum FileSystemUploadType {
  BINARY_CONTENT = 'binary',
}

type UploadProgress = {
  totalBytesSent: number
  totalBytesExpectedToSend: number
}

export const StorageAccessFramework = {
  async requestDirectoryPermissionsAsync() {
    return {granted: false, directoryUri: ''}
  },
  async createFileAsync(
    _directoryUri: string | null,
    _filename: string,
    _mimeType?: string,
  ) {
    throw new Error('Storage access is not supported on web')
  },
}

export async function copyAsync(_options: {from: string; to: string}) {}
export async function moveAsync(_options: {from: string; to: string}) {}
export async function deleteAsync(
  _uri: string,
  _options?: {idempotent?: boolean},
) {}
export async function makeDirectoryAsync(
  _uri: string,
  _options?: {intermediates?: boolean},
) {}
export async function readDirectoryAsync(_uri: string): Promise<string[]> {
  return []
}
export async function getInfoAsync(uri: string) {
  return {exists: false, uri, size: 0}
}
export async function readAsStringAsync(_uri: string): Promise<string> {
  return ''
}
export async function writeAsStringAsync(
  _uri: string,
  _contents: string,
  _options?: {encoding?: EncodingType},
) {}
export async function getFreeDiskStorageAsync(): Promise<number> {
  return 0
}

export function createUploadTask(
  url: string,
  fileUri: string,
  options: {
    headers?: Record<string, string>
    httpMethod?: string
    uploadType?: FileSystemUploadType
  },
  callback?: (progress: UploadProgress) => void,
) {
  return {
    async uploadAsync() {
      callback?.({totalBytesSent: 0, totalBytesExpectedToSend: 1})
      const response = await fetch(url, {
        method: 'POST',
        headers: options.headers,
        body: await fetch(fileUri).then(r => r.blob()),
      })
      return {
        status: response.status,
        body: await response.text(),
      }
    },
  }
}

export function createDownloadResumable(
  _url: string,
  fileUri: string,
  _options?: unknown,
) {
  return {
    async downloadAsync() {
      return {
        uri: fileUri,
        status: 200,
        headers: {},
        md5: null,
        mimeType: 'application/octet-stream',
      }
    },
    async cancelAsync() {},
  }
}
