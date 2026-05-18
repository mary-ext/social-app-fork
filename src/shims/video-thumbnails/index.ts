export async function getThumbnailAsync(
  uri: string,
  _options?: {time?: number; quality?: number},
): Promise<{uri: string; width: number; height: number}> {
  return {uri, width: 0, height: 0}
}
