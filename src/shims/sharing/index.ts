export async function isAvailableAsync(): Promise<boolean> {
  return typeof navigator !== 'undefined' && Boolean(navigator.share)
}

export async function shareAsync(
  url: string,
  _options?: unknown,
): Promise<void> {
  if (navigator.share) {
    await navigator.share({url})
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
