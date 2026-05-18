import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {LayoutAnimation} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {codeToLanguageName} from '#/locale/helpers'
import {logger} from '#/logger'
import {useLanguagePrefs} from '#/state/preferences'
import {onTranslateTask} from '#/shims/bsky-translate-text'
import {type TranslationTaskResult} from '#/shims/bsky-translate-text'
import {getLocales} from '#/shims/localization'
import {Context} from './context'
import {
  type ContextType,
  type TranslationFunctionParams,
  type TranslationOptions,
  type TranslationState,
} from './types'
import {guessLanguage} from './utils'

export * from './types'
export * from './utils'

const E_SAME_AS_SOURCE_LANGUAGE =
  'Translation result is the same as the source text.'
const E_EMPTY_RESULT = 'Translation result is empty.'
const E_INVALID_SOURCE_LANGUAGE = 'Invalid source language'

/**
 * Attempts on-device translation via local translation adapter.
 * Uses a lazy import to avoid crashing if the native module isn't linked into
 * the current build.
 */
async function attemptTranslation(
  input: string,
  targetLangCodeOriginal: string,
  sourceLangCodeOriginal?: string, // Auto-detects if not provided
): Promise<{
  translatedText: string
  targetLanguage: TranslationTaskResult['targetLanguage']
  sourceLanguage: TranslationTaskResult['sourceLanguage']
}> {
  // Note that Android only supports two-character language codes and will fail
  // on other input.
  // https://developers.google.com/android/reference/com/google/mlkit/nl/translate/TranslateLanguage
  let targetLangCode = targetLangCodeOriginal
  const sourceLangCode = sourceLangCodeOriginal

  const result = await onTranslateTask({
    input,
    targetLangCode,
    sourceLangCode,
  })

  // Since `input` is always a string, the result should always be a string.
  const translatedText =
    typeof result.translatedTexts === 'string' ? result.translatedTexts : ''

  if (translatedText === input) {
    throw new Error(E_SAME_AS_SOURCE_LANGUAGE)
  }

  if (translatedText === '') {
    throw new Error(E_EMPTY_RESULT)
  }

  return {
    translatedText,
    targetLanguage: result.targetLanguage,
    sourceLanguage:
      result.sourceLanguage ?? sourceLangCode ?? guessLanguage(input), // iOS doesn't return the source language
  }
}

/**
 * Native translation hook. Attempts on-device translation using Apple
 * Translation (iOS 18+) or Google ML Kit (Android).
 *
 * Falls back to Google Translate URL if the language pack is unavailable.
 *
 * Web uses index.web.ts which always opens Google Translate.
 */
export function useTranslate({
  key,
  forceGoogleTranslate = false,
}: TranslationOptions) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  useFocusEffect(
    useCallback(() => {
      const cleanup = context.acquireTranslation(key)
      return cleanup
    }, [key, context]),
  )

  const translate = useCallback(
    async (params: TranslationFunctionParams) => {
      return context.translate(
        {
          ...params,
        },
        {
          key,
          forceGoogleTranslate,
        },
      )
    },
    [context, forceGoogleTranslate, key],
  )

  const clearTranslation = useCallback(
    () => context.clearTranslation(key),
    [context, key],
  )

  return useMemo(
    () => ({
      translationState: context.translationState[key] ?? {
        status: 'idle',
      },
      translate,
      clearTranslation,
    }),
    [clearTranslation, context.translationState, key, translate],
  )
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const [translationState, setTranslationState] = useState<
    Record<string, TranslationState>
  >({})
  const [refCounts, setRefCounts] = useState<Record<string, number>>({})
  const langPrefs = useLanguagePrefs()
  const {t: l} = useLingui()
  const googleTranslate = useGoogleTranslate()

  useEffect(() => {
    setTranslationState(prev => {
      const keysToDelete: string[] = []

      for (const key of Object.keys(prev)) {
        if ((refCounts[key] ?? 0) <= 0) {
          keysToDelete.push(key)
        }
      }

      if (keysToDelete.length > 0) {
        const newState = {...prev}
        keysToDelete.forEach(key => {
          delete newState[key]
        })
        return newState
      }

      return prev
    })
  }, [refCounts])

  const acquireTranslation = useCallback((key: string) => {
    setRefCounts(prev => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }))

    return () => {
      setRefCounts(prev => {
        const newCount = (prev[key] ?? 1) - 1
        if (newCount <= 0) {
          const {[key]: _, ...rest} = prev
          return rest
        }
        return {...prev, [key]: newCount}
      })
    }
  }, [])

  const clearTranslation = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setTranslationState(prev => {
      delete prev[key]
      return {...prev}
    })
  }, [])

  const translate = useCallback<ContextType['translate']>(
    async (
      {
        text,
        expectedTargetLanguage,
        expectedSourceLanguage,
        possibleSourceLanguages,
        forceGoogleTranslate: forceGoogleTranslateOverride,
      },
      {key, forceGoogleTranslate},
    ) => {
      const shouldForceGoogleTranslate = Boolean(
        forceGoogleTranslateOverride ?? forceGoogleTranslate,
      )

      await googleTranslate(
        text,
        expectedTargetLanguage,
        expectedSourceLanguage,
      )
      return
    },
    [googleTranslate, l, langPrefs.appLanguage],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [acquireTranslation, clearTranslation, translate, translationState],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
