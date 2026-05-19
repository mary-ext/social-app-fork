import {createContext, useContext, useMemo} from 'react'
import {type StyleProp, type TextStyle, type ViewStyle} from 'react-native'

import {type Theme, themes} from './themes'

export * from './atoms'
export * from './palette'
export * from './platform'
export * from './themes'
export * as tokens from './tokens'
export * as utils from './utils'

export type TextStyleProp = {
  style?: StyleProp<TextStyle>
}

export type ViewStyleProp = {
  style?: StyleProp<ViewStyle>
}

export const Context = createContext({
  theme: themes.light,
})
Context.displayName = 'AlfContext'

export function Provider<T extends string, A extends Record<T, Theme>>({
  children,
  activeTheme,
  themes,
}: React.PropsWithChildren<{
  activeTheme: T
  themes: A
}>) {
  const value = useMemo(
    () => ({
      theme: themes[activeTheme],
    }),
    [activeTheme, themes],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTheme() {
  return useContext(Context).theme
}
