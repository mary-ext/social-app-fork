import {useEffect, useState} from 'react'

export function requireNativeModule(_name: string): Record<string, unknown> {
  return {}
}

type DefaultEventPayload = {
  currentTime: number
  isPlaying: boolean
}

export function useEvent<T>(
  target: unknown,
  eventName: string,
  initialValue: T,
): T
export function useEvent<T = DefaultEventPayload>(
  target: unknown,
  eventName: string,
  initialValue?: T,
): T | undefined {
  const [value, setValue] = useState<T | undefined>(initialValue)

  useEffect(() => {
    const eventTarget = target as {
      addListener?: (
        eventName: string,
        listener: (event: T) => void,
      ) => {remove: () => void}
    }
    const subscription = eventTarget.addListener?.(eventName, event =>
      setValue(event),
    )
    return () => subscription?.remove()
  }, [target, eventName])

  return value
}

export function useEventListener<T = DefaultEventPayload>(
  target: unknown,
  eventName: string,
  listener: (event: T) => void,
) {
  useEffect(() => {
    const eventTarget = target as {
      addListener?: (
        eventName: string,
        listener: (event: T) => void,
      ) => {remove: () => void}
    }
    const subscription = eventTarget.addListener?.(eventName, listener)
    return () => subscription?.remove()
  }, [target, eventName, listener])
}
