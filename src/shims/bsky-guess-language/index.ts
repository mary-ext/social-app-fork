export type LanguageResult = {
  language: string
  confidence: number
}

export function guessLanguage(text: string): string | undefined {
  const normalized = text.trim()
  if (!normalized) return undefined
  return 'en'
}

export async function guessLanguageAsync(
  text: string,
): Promise<LanguageResult[]> {
  const language = guessLanguage(text)
  return language ? [{language, confidence: 1}] : []
}
