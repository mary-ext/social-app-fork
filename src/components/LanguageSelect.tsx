import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import * as Select from '#/components/Select'

export function LanguageSelect({
  value,
  onChange,
  items = APP_LANGUAGES.map(l => ({
    label: l.name,
    value: l.code2,
  })),
  label,
}: {
  value?: string
  onChange: (value: string) => void
  items?: {label: string; value: string}[]
  label?: string
}) {
  const {t: l} = useLingui()

  const handleOnChange = useCallback(
    (value: string) => {
      if (!value) return
      onChange(sanitizeAppLanguageSetting(value))
    },
    [onChange],
  )

  return (
    <Select.Root
      value={value ? sanitizeAppLanguageSetting(value) : undefined}
      onValueChange={handleOnChange}>
      <Select.Trigger label={l`Select language`}>
        <Select.ValueText placeholder={l`Select language`} />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label={label}
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        )}
        items={items}
      />
    </Select.Root>
  )
}
