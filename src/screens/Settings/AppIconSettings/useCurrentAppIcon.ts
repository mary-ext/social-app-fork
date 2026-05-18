import {useCallback, useMemo, useState} from 'react'
import {useFocusEffect} from '@react-navigation/native'

import {useAppIconSets} from '#/screens/Settings/AppIconSettings/useAppIconSets'
import * as DynamicAppIcon from '#/shims/dynamic-app-icon'

export function useCurrentAppIcon() {
  const appIconSets = useAppIconSets()
  const [currentAppIcon, setCurrentAppIcon] = useState(() =>
    DynamicAppIcon.getAppIcon(),
  )

  // refresh current icon when screen is focused
  useFocusEffect(
    useCallback(() => {
      setCurrentAppIcon(DynamicAppIcon.getAppIcon())
    }, []),
  )

  return useMemo(() => {
    return (
      appIconSets.defaults.find(i => i.id === currentAppIcon) ??
      appIconSets.core.find(i => i.id === currentAppIcon) ??
      appIconSets.defaults[0]
    )
  }, [appIconSets, currentAppIcon])
}
