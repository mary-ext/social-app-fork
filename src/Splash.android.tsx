import {useEffect} from 'react'

import * as SplashScreen from '#/shims/splash-screen'

type Props = {
  isReady: boolean
}

export function Splash({isReady, children}: React.PropsWithChildren<Props>) {
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])
  if (isReady) {
    return children
  }
}
