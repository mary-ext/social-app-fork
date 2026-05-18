export async function setStringAsync(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

export const setUrlAsync = setStringAsync
