import {useState} from 'react'
import {View} from 'react-native'

import {useAppState} from '#/lib/appState'
import {atoms as a, useTheme} from '#/alf'
import {sizes as iconSizes} from '#/components/icons/common'
import {Mark as Logo} from '#/components/icons/Logo'
import {PrivacySensitive} from '#/shims/privacy-sensitive'

const ICON_SIZE = 'xl' as const

export function GrowthHack({
  children,
  align = 'right',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const t = useTheme()

  // the button has a variable width and is absolutely positioned, so we need to manually
  // set the minimum width of the underlying button
  const [width, setWidth] = useState<number | undefined>(undefined)

  const appState = useAppState()

  return children
}
