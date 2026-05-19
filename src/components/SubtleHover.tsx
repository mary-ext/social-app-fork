import {View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {IS_WEB_TOUCH_DEVICE} from '#/env'

type WebViewStyle = ViewStyle & {
  willChange?: 'opacity'
}

const webViewStyle = (style: WebViewStyle): ViewStyle => {
  return style as unknown as ViewStyle
}

export function SubtleHover({
  style,
  hover,
  web = true,
}: ViewStyleProp & {hover: boolean; web?: boolean; native?: boolean}) {
  const t = useTheme()

  let opacity: number
  switch (t.name) {
    case 'dark':
      opacity = 0.4
      break
    case 'dim':
      opacity = 0.45
      break
    case 'light':
      opacity = 0.5
      break
  }

  const el = (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.pointer_events_none,
        a.transition_opacity,
        t.atoms.bg_contrast_50,
        style,
        webViewStyle({willChange: 'opacity'}),
        {opacity: hover ? opacity : 0},
      ]}
    />
  )

  if (web) {
    return IS_WEB_TOUCH_DEVICE ? null : el
  }

  return null
}
