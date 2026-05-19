import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {type AppLanguage} from '#/locale/languages'
import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['languagePrefs'],
) => persisted.Schema['languagePrefs']
type StateContext = persisted.Schema['languagePrefs']
type ApiContext = {
  setAppLanguage: (code2: AppLanguage) => void
  setContentLanguages: (code2s: string[]) => void
  setPrimaryLanguage: (code2: string) => void
  setPostLanguage: (commaSeparatedLangCodes: string) => void
  savePostLanguageToHistory: () => void
}

const stateContext = createContext<StateContext>(
  persisted.defaults.languagePrefs,
)
stateContext.displayName = 'LanguagePrefsStateContext'
const apiContext = createContext<ApiContext>({
  setAppLanguage: (_: AppLanguage) => {},
  setContentLanguages: (_: string[]) => {},
  setPrimaryLanguage: (_: string) => {},
  setPostLanguage: (_: string) => {},
  savePostLanguageToHistory: () => {},
})
apiContext.displayName = 'LanguagePrefsApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(() => persisted.get('languagePrefs'))

  const setStateWrapped = useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('languagePrefs'))
      setState(s)
      persisted.write('languagePrefs', s)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('languagePrefs', nextLanguagePrefs => {
      setState(nextLanguagePrefs)
    })
  }, [setStateWrapped])

  const api = useMemo(
    () => ({
      setAppLanguage(code2: AppLanguage) {
        setStateWrapped(s => ({...s, appLanguage: code2}))
      },
      setContentLanguages(code2s: string[]) {
        setStateWrapped(s => ({...s, contentLanguages: code2s}))
      },
      setPrimaryLanguage(code2: string) {
        setStateWrapped(s => ({...s, primaryLanguage: code2}))
      },
      setPostLanguage(commaSeparatedLangCodes: string) {
        setStateWrapped(s => ({...s, postLanguage: commaSeparatedLangCodes}))
      },
      /**
       * Saves whatever language codes are currently selected into a history array,
       * which is then used to populate the language selector menu.
       */
      savePostLanguageToHistory() {
        // filter out duplicate `this.postLanguage` if exists, and prepend
        // value to start of array
        setStateWrapped(s => ({
          ...s,
          postLanguageHistory: [s.postLanguage]
            .concat(
              s.postLanguageHistory.filter(
                commaSeparatedLangCodes =>
                  commaSeparatedLangCodes !== s.postLanguage,
              ),
            )
            .slice(0, 6),
        }))
      },
    }),
    [setStateWrapped],
  )

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useLanguagePrefs() {
  return useContext(stateContext)
}

export function useLanguagePrefsApi() {
  return useContext(apiContext)
}

export function getContentLanguages() {
  return persisted.get('languagePrefs').contentLanguages
}

export function getAppLanguageAsContentLanguage() {
  return persisted.get('languagePrefs').appLanguage.split('-')[0] ?? 'en'
}

export function toPostLanguages(postLanguage: string): string[] {
  // filter out empty strings if exist
  return postLanguage.split(',').filter(Boolean)
}

export function fromPostLanguages(languages: string[]): string {
  return languages.filter(Boolean).join(',')
}

export function hasPostLanguage(postLanguage: string, code2: string): boolean {
  return toPostLanguages(postLanguage).includes(code2)
}
