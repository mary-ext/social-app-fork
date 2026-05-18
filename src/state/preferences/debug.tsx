import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  debugFeedContextEnabled: Exclude<
    persisted.Schema['debugFeedContextEnabled'],
    undefined
  >
}
type ApiContext = {
  setDebugFeedContextEnabled(
    enabled: Exclude<persisted.Schema['debugFeedContextEnabled'], undefined>,
  ): void
}

const StateContext = createContext<StateContext>({
  debugFeedContextEnabled: Boolean(persisted.defaults.debugFeedContextEnabled),
})
StateContext.displayName = 'DebugPreferencesStateContext'
const ApiContext = createContext<ApiContext>({
  setDebugFeedContextEnabled() {},
})
ApiContext.displayName = 'DebugPreferencesApiContext'

function usePersistedBooleanValue<T extends keyof persisted.Schema>(key: T) {
  const [value, _set] = useState(() => {
    return Boolean(persisted.get(key))
  })
  const set = useCallback<
    (value: Exclude<persisted.Schema[T], undefined>) => void
  >(
    enabled => {
      _set(Boolean(enabled))
      persisted.write(key, enabled)
    },
    [key, _set],
  )
  useEffect(() => {
    return persisted.onUpdate(key, enabled => {
      _set(Boolean(enabled))
    })
  }, [key, _set])

  return [value, set] as const
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [debugFeedContextEnabled, setDebugFeedContextEnabled] =
    usePersistedBooleanValue('debugFeedContextEnabled')

  const state = useMemo(
    () => ({debugFeedContextEnabled}),
    [debugFeedContextEnabled],
  )
  const api = useMemo(
    () => ({setDebugFeedContextEnabled}),
    [setDebugFeedContextEnabled],
  )

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useDebugFeedContextEnabled() {
  return useContext(StateContext).debugFeedContextEnabled
}

export function useSetDebugFeedContextEnabled() {
  return useContext(ApiContext).setDebugFeedContextEnabled
}
