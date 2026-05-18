import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'

export function useIsKeyboardVisible({
  iosUseWillEvents,
}: {
  iosUseWillEvents?: boolean
} = {}) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  // NOTE
  // only iOS supports the "will" events
  // -prf
  const showEvent =
    'keyboardDidShow'
  const hideEvent =
    'keyboardDidHide'

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    )
    const keyboardHideListener = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    )

    return () => {
      keyboardHideListener.remove()
      keyboardShowListener.remove()
    }
  }, [showEvent, hideEvent])

  return [isKeyboardVisible]
}
