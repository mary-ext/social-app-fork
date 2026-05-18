import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['kawaii']

const stateContext = createContext<StateContext>(persisted.defaults.kawaii)
stateContext.displayName = 'KawaiiStateContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('kawaii'))

  const setStateWrapped = useCallback(
    (kawaii: persisted.Schema['kawaii']) => {
      setState(kawaii)
      persisted.write('kawaii', kawaii)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('kawaii', nextKawaii => {
      setState(nextKawaii)
    })
  }, [setStateWrapped])

  useEffect(() => {
    const kawaii = new URLSearchParams(window.location.search).get('kawaii')
    switch (kawaii) {
      case 'true':
        setStateWrapped(true)
        break
      case 'false':
        setStateWrapped(false)
        break
    }
  }, [setStateWrapped])

  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useKawaiiMode() {
  return useContext(stateContext)
}
