import {type ReactNode, useRef} from 'react'
import {View, type ViewProps} from 'react-native'

export function ScrollEdgeEffect(props: ViewProps & {edge?: string}) {
  return <View {...props} />
}

export function ScrollEdgeEffectProvider({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}

export function useScrollEdgeEffectRef<T>() {
  return useRef<T>(null)
}
