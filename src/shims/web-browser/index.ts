export enum WebBrowserPresentationStyle {
  FULL_SCREEN = 'fullScreen',
}

export async function openBrowserAsync(
  url: string,
  _options?: unknown,
): Promise<{type: string}> {
  window.open(url, '_blank', 'noopener,noreferrer')
  return {type: 'opened'}
}

export async function dismissBrowser(): Promise<void> {}
