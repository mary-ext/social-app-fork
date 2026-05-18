export type TranslationTaskResult = {
  translatedTexts: string | string[]
  sourceLanguage?: string | null
  targetLanguage: string
}

export async function onTranslateTask({
  input,
  targetLangCode,
  sourceLangCode,
}: {
  input: string
  targetLangCode: string
  sourceLangCode?: string
}): Promise<TranslationTaskResult> {
  return {
    translatedTexts: input,
    sourceLanguage: sourceLangCode,
    targetLanguage: targetLangCode,
  }
}
