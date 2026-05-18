import {useMemo} from 'react'

import {useOpenComposer as useRootOpenComposer} from '#/state/shell/composer'

export function useOpenComposer() {
  const {openComposer} = useRootOpenComposer()
  return useMemo(() => {
    return {
      openComposer,
    }
  }, [openComposer])
}
