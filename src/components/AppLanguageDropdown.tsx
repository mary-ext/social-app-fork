import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {resetPostsFeedQueries} from '#/state/queries/post-feed'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Select from '#/components/Select'

export function AppLanguageDropdown() {
  const t = useTheme()
  const {t: l} = useLingui()

  const queryClient = useQueryClient()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = useCallback(
    (value: string) => {
      if (!value) {
        return
      }

      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }

      resetPostsFeedQueries(queryClient)
    },
    [queryClient, sanitizedLang, setLangPrefs],
  )

  return (
    <Select.Root value={sanitizedLang} onValueChange={onChangeAppLanguage}>
      <Select.Trigger label={l`Change app language`}>
        {({props}) => (
          <Button
            {...props}
            label={props.accessibilityLabel}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="rectangular"
            style={[a.pr_xs, a.pl_sm, a.gap_sm, {alignSelf: 'flex-start'}]}>
            <Select.ValueText
              placeholder={l`Select an app language`}
              style={[t.atoms.text_contrast_medium]}
            />
            <Select.Icon style={[t.atoms.text_contrast_medium]} />
          </Button>
        )}
      </Select.Trigger>
      <Select.Content
        label={l`Select language`}
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        )}
        items={APP_LANGUAGES.map(language => ({
          label: language.name,
          value: language.code2,
        }))}
      />
    </Select.Root>
  )
}
