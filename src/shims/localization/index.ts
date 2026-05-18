export type Locale = {
  languageTag: string
  languageCode: string | null
  regionCode: string | null
  currencyCode: string | null
  currencySymbol: string | null
  decimalSeparator: string | null
  digitGroupingSeparator: string | null
  measurementSystem: string | null
  textDirection: 'ltr' | 'rtl' | null
  temperatureUnit: string | null
}

export function getLocales(): Locale[] {
  const languageTags =
    typeof navigator === 'undefined' || navigator.languages.length === 0
      ? ['en']
      : navigator.languages

  return languageTags.map(languageTag => {
    let locale: Intl.Locale | undefined
    try {
      locale = new Intl.Locale(languageTag)
    } catch {
      locale = new Intl.Locale('en')
    }

    return {
      languageTag,
      languageCode: locale.language || null,
      regionCode: locale.region || null,
      currencyCode: null,
      currencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      measurementSystem: null,
      textDirection: null,
      temperatureUnit: null,
    }
  })
}
