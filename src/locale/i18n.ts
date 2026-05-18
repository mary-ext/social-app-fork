// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'
import '@formatjs/intl-numberformat/polyfill-force'
import '@formatjs/intl-displaynames/polyfill-force'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-displaynames/locale-data/en'

import {useEffect, useState} from 'react'
import {i18n} from '@lingui/core'
import defaultLocale from 'date-fns/locale/en-US'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'
import {messages as messagesEn} from '#/locale/locales/en/messages'
import {useLanguagePrefs} from '#/state/preferences'

export async function dynamicActivate(locale: AppLanguage) {
  i18n.loadAndActivate({locale, messages: messagesEn})

  return defaultLocale
}

export function useLocaleLanguage() {
  const {appLanguage} = useLanguagePrefs()
  const [dateLocale, setDateLocale] = useState(defaultLocale)

  useEffect(() => {
    dynamicActivate(sanitizeAppLanguageSetting(appLanguage)).then(locale => {
      setDateLocale(locale)
    })
  }, [appLanguage])

  return dateLocale
}
