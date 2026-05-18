import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

export type BackgroundNotificationHandlerPreferences = {
  playSoundChat: boolean
}

type ContextValue = {
  preferences: BackgroundNotificationHandlerPreferences
  setPref: <Key extends keyof BackgroundNotificationHandlerPreferences>(
    key: Key,
    value: BackgroundNotificationHandlerPreferences[Key],
  ) => void
}

const Context = createContext<ContextValue>({
  preferences: {playSoundChat: true},
  setPref: () => {},
})

export const useBackgroundNotificationPreferences = () =>
  useContext(Context)

export function BackgroundNotificationPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [preferences, setPreferences] =
    useState<BackgroundNotificationHandlerPreferences>({
      playSoundChat: true,
    })

  const value = useMemo<ContextValue>(
    () => ({
      preferences,
      setPref: (key, nextValue) => {
        setPreferences(prev => ({...prev, [key]: nextValue}))
      },
    }),
    [preferences],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const BackgroundNotificationHandler = {
  async getAllPrefsAsync() {
    return {playSoundChat: true}
  },
  async setBoolAsync() {},
  async setStringAsync() {},
  async setBadgeCountAsync(_count?: number) {},
}

export default BackgroundNotificationHandler
